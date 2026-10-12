import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { JobEvent, JobPriority, JobStatus } from "../lib/job-types";

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  company: text("company").notNull(),
  title: text("title").notNull(),
  location: text("location").notNull().default(""),
  workMode: text("work_mode").notNull().default(""),
  salary: text("salary").notNull().default(""),
  url: text("url").notNull().default(""),
  jd: text("jd").notNull().default(""),
  status: text("status").$type<JobStatus>().notNull().default("saved"),
  priority: text("priority").$type<JobPriority>().notNull().default("medium"),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  resumeVersion: text("resume_version").notNull().default(""),
  contact: text("contact").notNull().default(""),
  nextAction: text("next_action").notNull().default(""),
  followUpDate: text("follow_up_date").notNull().default(""),
  appliedAt: text("applied_at").notNull().default(""),
  sourceNote: text("source_note").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  version: integer("version").notNull().default(1),
  events: text("events", { mode: "json" }).$type<JobEvent[]>().notNull().default([]),
}, (table) => [index("jobs_user_updated_idx").on(table.userId, table.updatedAt), index("jobs_user_followup_idx").on(table.userId, table.followUpDate)]);
