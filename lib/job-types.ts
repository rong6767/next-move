export const JOB_STATUSES = ["saved", "ready", "applied", "screening", "interview", "offer", "rejected", "withdrawn"] as const;
export type JobStatus = typeof JOB_STATUSES[number];
export const JOB_PRIORITIES = ["high", "medium", "low"] as const;
export type JobPriority = typeof JOB_PRIORITIES[number];
export const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "待评估", ready: "待投递", applied: "已投递", screening: "初筛中", interview: "面试中", offer: "已获 Offer", rejected: "未通过", withdrawn: "已撤回",
};
export const PRIORITY_LABELS: Record<JobPriority, string> = { high: "优先投递", medium: "常规", low: "观望" };

export type JobEvent = { id: string; at: string; kind: string; text: string; actor: string };
export type Job = {
  id: string;
  company: string;
  title: string;
  location: string;
  workMode: string;
  salary: string;
  url: string;
  jd: string;
  status: JobStatus;
  priority: JobPriority;
  tags: string[];
  resumeVersion: string;
  contact: string;
  nextAction: string;
  followUpDate: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  version: number;
  events: JobEvent[];
  sourceNote: string;
};
export type JobFields = Omit<Job, "id" | "createdAt" | "updatedAt" | "version" | "events">;
export type JobInput = Partial<JobFields> & { version?: number };

/** Product dates consistently use the user's Toronto time zone. */
export function todayDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function isDue(job: Pick<Job, "followUpDate" | "status" | "archived">, today = todayDate()): boolean {
  return !job.archived && !!job.followUpDate && job.followUpDate <= today && job.status !== "rejected" && job.status !== "withdrawn";
}
