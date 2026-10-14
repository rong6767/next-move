import { isDue, todayDate, type Job, type JobPriority } from "./job-types";

export type JobSort = "priority" | "updated" | "followup" | "company";
export type CompanyGroup = {
  key: string;
  name: string;
  jobs: Job[];
  locations: string[];
  pendingCount: number;
  appliedCount: number;
  interviewCount: number;
  dueCount: number;
  nextFollowUpDate: string;
  highestPriority: JobPriority;
};

const priorityRank: Record<JobPriority, number> = { high: 0, medium: 1, low: 2 };
const submitted = (job: Job) => !!job.appliedAt || ["applied", "screening", "interview", "offer"].includes(job.status);
const pending = (job: Job) => !submitted(job) && (job.status === "saved" || job.status === "ready");
const hasActiveFollowup = (job: Job) => !job.archived && job.status !== "rejected" && job.status !== "withdrawn" && !!job.followUpDate;

/**
 * Match formatting variants, never parent-company names or substrings.
 * Keep meaningful symbols such as &, + and # so distinct brand names stay distinct.
 */
export function companyKey(name: string): string {
  return name.normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[.'’‘`]/gu, "")
    .replace(/[^\p{L}\p{M}\p{N}&+#\s]/gu, " ")
    .replace(/\s*([&+#])\s*/gu, "$1")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/\s+(?:inc|incorporated|ltd|limited)$/u, "")
    .trim();
}

/** Group only the provided jobs; filtering and sorting stay under the caller's control. */
export function groupJobsByCompany(jobs: Job[], today = todayDate()): CompanyGroup[] {
  const groups = new Map<string, CompanyGroup>();
  const locationKeys = new Map<string, Set<string>>();
  for (const job of jobs) {
    const key = companyKey(job.company);
    let group = groups.get(key);
    if (!group) {
      group = { key, name: job.company.trim() || "未命名公司", jobs: [], locations: [], pendingCount: 0, appliedCount: 0, interviewCount: 0, dueCount: 0, nextFollowUpDate: "", highestPriority: job.priority };
      groups.set(key, group);
      locationKeys.set(key, new Set());
    }
    group.jobs.push(job);
    if (pending(job)) group.pendingCount++;
    if (submitted(job)) group.appliedCount++;
    if (job.status === "interview") group.interviewCount++;
    if (isDue(job, today)) group.dueCount++;
    if (priorityRank[job.priority] < priorityRank[group.highestPriority]) group.highestPriority = job.priority;
    if (hasActiveFollowup(job) && (!group.nextFollowUpDate || job.followUpDate < group.nextFollowUpDate)) group.nextFollowUpDate = job.followUpDate;
    const location = job.location.trim();
    const locationKey = location.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ");
    const seenLocations = locationKeys.get(key)!;
    if (location && !seenLocations.has(locationKey)) {
      group.locations.push(location);
      seenLocations.add(locationKey);
    }
  }
  return [...groups.values()];
}

function compareFollowup(a: string, b: string): number {
  if (!a) return b ? 1 : 0;
  if (!b) return -1;
  return a.localeCompare(b);
}

/** Return a sorted copy with deterministic ties; never mutate saved records or input order. */
export function sortJobs(jobs: Job[], sort: JobSort): Job[] {
  return jobs.map((job, index) => ({ job, index })).sort((a, b) => {
    let order = 0;
    switch (sort) {
      case "priority": order = priorityRank[a.job.priority] - priorityRank[b.job.priority]; break;
      case "updated": order = b.job.updatedAt.localeCompare(a.job.updatedAt); break;
      case "followup": order = compareFollowup(hasActiveFollowup(a.job) ? a.job.followUpDate : "", hasActiveFollowup(b.job) ? b.job.followUpDate : ""); break;
      case "company": order = companyKey(a.job.company).localeCompare(companyKey(b.job.company), "zh-CN"); break;
    }
    return order || b.job.createdAt.localeCompare(a.job.createdAt) || a.job.id.localeCompare(b.job.id) || a.index - b.index;
  }).map(({ job }) => job);
}
