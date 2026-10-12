import { and, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { getDb } from "../db";
import { jobs as table } from "../db/schema";
import { isDue, JOB_PRIORITIES, JOB_STATUSES, STATUS_LABELS, todayDate, type Job, type JobEvent, type JobFields, type JobInput, type JobStatus } from "./job-types";

export class JobError extends Error {
  constructor(message: string, public status = 400, public code = "INVALID_INPUT") { super(message); }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new JobError("请提供 JSON 对象。");
  return value as Record<string, unknown>;
}
function stringValue(value: unknown, name: string, max: number, required = false): string {
  if (typeof value !== "string") throw new JobError(`${name} 必须是文本。`);
  const text = value.trim();
  if (text.length > max) throw new JobError(`${name} 最多 ${max} 个字符。`);
  if (required && !text) throw new JobError(`${name} 不能为空。`);
  return text;
}
function dateValue(value: unknown, name: string): string {
  const text = stringValue(value, name, 10);
  if (!text) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number(text.slice(0, 4)) < 1900) throw new JobError(`${name} 需要 YYYY-MM-DD 格式。`);
  const date = new Date(`${text}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== text) throw new JobError(`${name} 不是有效日期。`);
  return text;
}

/** Validate only mutable fields; omitted fields stay omitted during updates. */
export function validateJobInput(value: unknown, create = false): JobInput {
  const input = record(value);
  const result: Record<string, unknown> = {};
  const strings: Record<string, number> = { company: 200, title: 300, location: 300, workMode: 1000, salary: 300, url: 2048, jd: 80000, resumeVersion: 300, contact: 2000, nextAction: 2000, sourceNote: 4000 };
  for (const [key, max] of Object.entries(strings)) {
    if (key in input) result[key] = stringValue(input[key], key, max, key === "company" || key === "title");
  }
  if (create && (!result.company || !result.title)) throw new JobError("公司和岗位名称必填。");
  if (result.url) {
    try { const url = new URL(result.url as string); if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error(); }
    catch { throw new JobError("岗位链接需要有效的 http 或 https 地址。"); }
  }
  if ("status" in input) {
    if (!JOB_STATUSES.includes(input.status as JobStatus)) throw new JobError("未知的求职状态。");
    result.status = input.status;
  }
  if ("priority" in input) {
    if (!JOB_PRIORITIES.includes(input.priority as JobFields["priority"])) throw new JobError("优先级应为 high、medium 或 low。");
    result.priority = input.priority;
  }
  if ("tags" in input) {
    if (!Array.isArray(input.tags) || input.tags.length > 20) throw new JobError("标签应为最多 20 项的列表。");
    result.tags = [...new Set(input.tags.map((tag) => stringValue(tag, "标签", 80, true)))];
  }
  for (const key of ["followUpDate", "appliedAt"]) if (key in input) result[key] = dateValue(input[key], key);
  if ("archived" in input) {
    if (typeof input.archived !== "boolean") throw new JobError("archived 必须是布尔值。");
    result.archived = input.archived;
  }
  if ("version" in input) {
    if (!Number.isInteger(input.version) || (input.version as number) < 1) throw new JobError("version 必须是正整数。");
    result.version = input.version;
  }
  return result as JobInput;
}

export function makeEvent(text: string, kind = "note", actor = "你"): JobEvent {
  return { id: crypto.randomUUID(), at: new Date().toISOString(), text: stringValue(text, "记录", 12000, true), kind: stringValue(kind, "记录类型", 40, true), actor: stringValue(actor, "操作人", 100, true) };
}
function importedEvents(value: unknown): JobEvent[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 1000) throw new JobError("单个岗位最多可导入 1,000 条记录。");
  return value.map((raw) => {
    const item = record(raw);
    const event = makeEvent(stringValue(item.text, "记录", 12000, true), item.kind === undefined ? "note" : stringValue(item.kind, "记录类型", 40, true), item.actor === undefined ? "你" : stringValue(item.actor, "操作人", 100, true));
    if (item.at !== undefined) {
      const at = stringValue(item.at, "记录时间", 40, true);
      if (!Number.isFinite(new Date(at).getTime())) throw new JobError("记录时间无效。");
      event.at = new Date(at).toISOString();
    }
    return event;
  });
}

export function makeJob(value: unknown, actor = "你", importing = false): Job {
  const { version: _version, ...input } = validateJobInput(value, true);
  const now = new Date().toISOString();
  const job: Job = {
    id: crypto.randomUUID(), company: "", title: "", location: "", workMode: "", salary: "", url: "", jd: "", status: "saved", priority: "medium", tags: [], resumeVersion: "", contact: "", nextAction: "", followUpDate: "", appliedAt: "", sourceNote: "", archived: false,
    ...input, createdAt: now, updatedAt: now, version: 1, events: importing ? importedEvents(record(value).events) : [],
  };
  if (importing && record(value).createdAt !== undefined) {
    const original = stringValue(record(value).createdAt, "创建时间", 40, true);
    if (!Number.isFinite(new Date(original).getTime())) throw new JobError("创建时间无效。");
    job.createdAt = new Date(original).toISOString();
  }
  if ((job.status === "saved" || job.status === "ready") && job.appliedAt) job.status = "applied";
  if (!importing && job.status === "applied" && !job.appliedAt) job.appliedAt = todayDate();
  if (job.events.length < 1000) job.events.push(makeEvent(importing ? "导入岗位记录" : "添加到求职清单", "created", actor));
  return job;
}

export function applyJobPatch(current: Job, input: JobInput, actor = "你", event?: JobEvent): Job {
  const { version: _version, ...fields } = input;
  const next = { ...current, ...fields, events: [...current.events], updatedAt: new Date().toISOString(), version: current.version + 1 };
  if ((next.status === "saved" || next.status === "ready") && next.appliedAt) next.status = "applied";
  if (fields.status === "applied" && current.status !== "applied" && !next.appliedAt) next.appliedAt = todayDate();
  if (next.status !== current.status) next.events.push(makeEvent(`状态变更：${STATUS_LABELS[current.status]} → ${STATUS_LABELS[next.status]}`, "status", actor));
  if (fields.archived !== undefined && fields.archived !== current.archived) next.events.push(makeEvent(fields.archived ? "归档岗位" : "恢复岗位", "archive", actor));
  if (event) next.events.push(event);
  if (next.events.length > 1000) throw new JobError("记录已达到 1,000 条，请先导出备份。", 400, "EVENT_LIMIT");
  return next;
}

function publicJob(row: typeof table.$inferSelect): Job {
  const { userId: _userId, ...job } = row;
  return job;
}
function jobId(value: unknown): string {
  return stringValue(value, "岗位 ID", 100, true);
}
export type JobFilters = { status?: string; search?: string; due?: boolean; archived?: boolean | "all" };
export async function listJobs(userId: string, filters: JobFilters = {}): Promise<Job[]> {
  const conditions = [eq(table.userId, userId)];
  if (filters.archived !== "all") conditions.push(eq(table.archived, filters.archived ?? false));
  if (filters.status && !JOB_STATUSES.includes(filters.status as JobStatus)) throw new JobError("未知的求职状态筛选。");
  if (filters.status) conditions.push(eq(table.status, filters.status as JobStatus));
  const rows = await getDb().select().from(table).where(and(...conditions)).orderBy(desc(table.updatedAt), desc(table.id));
  let jobs = rows.map(publicJob);
  if (filters.search) {
    const search = stringValue(filters.search, "搜索词", 300).toLocaleLowerCase();
    jobs = jobs.filter((job) => [job.company, job.title, job.location, job.jd, ...job.tags].some((field) => field.toLocaleLowerCase().includes(search)));
  }
  if (filters.due) jobs = jobs.filter((job) => isDue(job));
  return jobs;
}
export async function getJob(userId: string, id: unknown): Promise<Job> {
  const [row] = await getDb().select().from(table).where(and(eq(table.userId, userId), eq(table.id, jobId(id)))).limit(1);
  if (!row) throw new JobError("岗位不存在或你无权访问。", 404, "NOT_FOUND");
  return publicJob(row);
}
export async function createJob(userId: string, value: unknown, actor = "你", event?: JobEvent): Promise<Job> {
  const job = makeJob(value, actor);
  if (event) job.events.push(event);
  await getDb().insert(table).values({ ...job, userId });
  return job;
}

/** A version predicate makes both fields and history change atomically. */
export async function updateJob(userId: string, id: unknown, value: unknown, actor = "你", event?: JobEvent): Promise<Job> {
  const input = validateJobInput(value);
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await getJob(userId, id);
    if (input.version !== undefined && input.version !== current.version) throw new JobError("该岗位刚刚被更新，请刷新后再保存。", 409, "VERSION_CONFLICT");
    const next = applyJobPatch(current, input, actor, event);
    const { id: _id, createdAt: _createdAt, ...fields } = next;
    const [updated] = await getDb().update(table).set(fields).where(and(eq(table.userId, userId), eq(table.id, current.id), eq(table.version, current.version))).returning();
    if (updated) return publicJob(updated);
    if (input.version !== undefined) break;
  }
  throw new JobError("该岗位刚刚被更新，请刷新后再保存。", 409, "VERSION_CONFLICT");
}
export async function addJobEvent(userId: string, id: unknown, value: unknown, actor = "你"): Promise<Job> {
  const input = record(value);
  const event = makeEvent(stringValue(input.text, "记录", 12000, true), input.kind === undefined ? "note" : stringValue(input.kind, "记录类型", 40, true), actor);
  return updateJob(userId, id, input.version === undefined ? {} : { version: input.version }, actor, event);
}

function dedupeKeys(job: Pick<Job, "company" | "title" | "location" | "url">): string[] {
  const keys = [`role:${[job.company, job.title, job.location].map((field) => field.trim().toLocaleLowerCase()).join("|")}`];
  if (job.url) { const url = new URL(job.url); url.hash = ""; keys.push(`url:${url.toString().replace(/\/$/, "")}`); }
  return keys;
}
export async function importJobs(userId: string, value: unknown, actor = "你"): Promise<{ imported: number; skipped: number; jobs: Job[] }> {
  const input = record(value);
  if (!Array.isArray(input.jobs) || input.jobs.length > 100) throw new JobError("一次可导入最多 100 个岗位，格式为 { jobs: [...] }。");
  // Validate the entire batch before any write to avoid partially imported invalid files.
  const candidates = input.jobs.map((job) => makeJob(job, actor, true));
  const existing = await listJobs(userId, { archived: "all" });
  const keys = new Set(existing.flatMap(dedupeKeys));
  const fresh: Job[] = [];
  for (const job of candidates) {
    const candidateKeys = dedupeKeys(job);
    if (candidateKeys.some((key) => keys.has(key))) continue;
    fresh.push(job);
    candidateKeys.forEach((key) => keys.add(key));
  }
  let imported = 0;
  if (fresh.length) {
    const db = getDb();
    const columns = Object.keys(getTableColumns(table));
    // The final check runs inside D1's transaction, so simultaneous imports cannot
    // both insert the same candidate after taking stale pre-import snapshots.
    const statements = fresh.map((job) => {
      const values: Record<string, unknown> = { ...job, userId, tags: JSON.stringify(job.tags), events: JSON.stringify(job.events), archived: Number(job.archived) };
      const roleMatch = sql`lower(trim(${table.company})) = ${job.company.toLocaleLowerCase()} and lower(trim(${table.title})) = ${job.title.toLocaleLowerCase()} and lower(trim(${table.location})) = ${job.location.toLocaleLowerCase()}`;
      const match = job.url ? sql`((${roleMatch}) or ${table.url} = ${job.url})` : roleMatch;
      return db.insert(table).select(sql`select ${sql.join(columns.map((key) => sql`${values[key]}`), sql`, `)} where not exists (select 1 from ${table} where ${table.userId} = ${userId} and ${match})`).returning();
    });
    const results = await db.batch([statements[0]!, ...statements.slice(1)]);
    imported = results.reduce((count, rows) => count + rows.length, 0);
  }
  return { imported, skipped: candidates.length - imported, jobs: await listJobs(userId, { archived: "all" }) };
}

export function filtersFromUrl(url: URL): JobFilters {
  const archived = url.searchParams.get("archived");
  return { status: url.searchParams.get("status") || undefined, search: url.searchParams.get("search") || undefined, due: url.searchParams.get("due") === "true", archived: archived === "all" ? "all" : archived === "true" };
}
export function apiError(error: unknown): Response {
  if (error instanceof JobError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  console.error("Job store failure", error);
  return Response.json({ error: "保存服务暂时不可用，请稍后重试。", code: "STORE_UNAVAILABLE" }, { status: 503 });
}
export function assertBrowserWrite(request: Request): void {
  const origin = request.headers.get("Origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("Sec-Fetch-Site") === "cross-site") throw new JobError("请在本站内完成这项操作。", 403, "CROSS_ORIGIN");
  if (!origin && request.headers.get("Sec-Fetch-Site") !== "same-origin") throw new JobError("这项操作需要来自本站的请求。", 403, "ORIGIN_REQUIRED");
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) throw new JobError("请使用 JSON 请求。", 415, "JSON_REQUIRED");
}
export async function readBody(request: Request, limit = 2_000_000): Promise<unknown> {
  const length = Number(request.headers.get("Content-Length"));
  if (length > limit) throw new JobError("导入内容过大，请分批处理。", 413, "BODY_TOO_LARGE");
  // Bound streaming reads as well as declared lengths, before materializing the JSON.
  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let bytes = 0;
  if (reader) {
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > limit) {
          await reader.cancel();
          throw new JobError("导入内容过大，请分批处理。", 413, "BODY_TOO_LARGE");
        }
        chunks.push(decoder.decode(chunk.value, { stream: true }));
      }
      chunks.push(decoder.decode());
    } finally { reader.releaseLock(); }
  }
  const text = chunks.join("");
  try { return JSON.parse(text); } catch { throw new JobError("无法读取 JSON 内容。"); }
}
