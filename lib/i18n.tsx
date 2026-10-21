"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { JobPriority, JobStatus } from "./job-types";

export type Locale = "zh" | "en";
const STORAGE_KEY = "nextmove.locale.v1";
const statusLabels: Record<Locale, Record<JobStatus, string>> = {
  zh: { saved: "待准备", ready: "待投递", applied: "已投递", screening: "初筛中", interview: "面试中", offer: "收到 Offer", rejected: "未通过", withdrawn: "已撤回" },
  en: { saved: "To prepare", ready: "Ready to apply", applied: "Applied", screening: "Screening", interview: "Interviewing", offer: "Offer received", rejected: "Not selected", withdrawn: "Withdrawn" },
};
const priorityLabels: Record<Locale, Record<JobPriority, string>> = {
  zh: { high: "优先", medium: "常规", low: "备选" },
  en: { high: "High", medium: "Normal", low: "Backup" },
};

export function statusLabelFor(status: JobStatus, locale: Locale): string { return statusLabels[locale][status] ?? status; }
export function priorityLabelFor(priority: JobPriority, locale: Locale): string { return priorityLabels[locale][priority] ?? priority; }

/** Keep calendar dates on the same day; real timestamps display in Toronto time. */
export function formatShortDate(value: string, locale: Locale): string {
  const input = value.trim();
  if (!input) return locale === "en" ? "Not set" : "未设置";
  const calendarDate = /^\d{4}-\d{2}-\d{2}$/.test(input);
  const date = new Date(calendarDate ? `${input}T12:00:00Z` : input);
  if (!Number.isFinite(date.getTime()) || (calendarDate && date.toISOString().slice(0, 10) !== input)) return value;
  return new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "zh-CN", { month: "short", day: "numeric", timeZone: "America/Toronto" }).format(date);
}

const fieldLabels: Record<string, string> = {
  company: "Company", title: "Role title", location: "Location", workMode: "Work arrangement", salary: "Salary", url: "Job link", jd: "Job description", resumeVersion: "Resume version", contact: "Contact", nextAction: "Next action", sourceNote: "Source notes", followUpDate: "Follow-up date", appliedAt: "Application date", archived: "archived", version: "version", due: "due", search: "search", status: "status", applicationEvidence: "Application evidence",
  "标签": "Tag", "记录": "Note", "记录类型": "Note type", "操作人": "Author", "记录时间": "Note timestamp", "创建时间": "Creation timestamp", "岗位 ID": "Role ID", "搜索词": "Search term",
};
const errors: Record<string, string> = {
  "请提供 JSON 对象。": "Please provide a JSON object.",
  "公司和岗位名称必填。": "Company and role title are required.",
  "岗位链接需要有效的 http 或 https 地址。": "Enter a valid http or https job link.",
  "未知的求职状态。": "This application status is not supported.",
  "未知的求职状态筛选。": "This application status filter is not supported.",
  "优先级应为 high、medium 或 low。": "Priority must be high, medium, or low.",
  "标签应为最多 20 项的列表。": "Enter a list of up to 20 tags.",
  "version 必须是正整数。": "version must be a positive integer.",
  "单个岗位最多可导入 1,000 条记录。": "You can import up to 1,000 timeline entries per role.",
  "记录时间无效。": "The note timestamp is invalid.",
  "创建时间无效。": "The creation timestamp is invalid.",
  "记录已达到 1,000 条，请先导出备份。": "This role has reached the 1,000-entry limit. Export a backup before continuing.",
  "岗位不存在或你无权访问。": "This role does not exist or you do not have access to it.",
  "该岗位刚刚被更新，请刷新后再保存。": "This role was just updated. Refresh before saving again.",
  "一次可导入最多 100 个岗位，格式为 { jobs: [...] }。": "Import up to 100 roles at a time using { jobs: [...] }.",
  "保存服务暂时不可用，请稍后重试。": "The save service is temporarily unavailable. Please try again shortly.",
  "请在本站内完成这项操作。": "Complete this action from this website.",
  "这项操作需要来自本站的请求。": "This action must be requested from this website.",
  "请使用 JSON 请求。": "Send this request as JSON.",
  "导入内容过大，请分批处理。": "This import is too large. Split it into smaller batches.",
  "无法读取 JSON 内容。": "The JSON could not be read. Check the file format.",
  "请先使用 ChatGPT 登录。": "Sign in with ChatGPT first.",
  "请先登录": "Sign in first.",
  "需要 ChatGPT 登录。": "Sign in with ChatGPT first.",
  "工具参数必须是对象。": "Tool arguments must be a JSON object.",
  "archived 应为布尔值或 all。": "archived must be a boolean or all.",
  "记录已投递或后续进度前，需要用户明确确认或可靠收据，并通过 applicationEvidence 提供依据。": "Recording an application or a later stage requires explicit user confirmation or a reliable receipt in applicationEvidence.",
  "applicationEvidence 应为最多 4,000 字的文本。": "Application evidence must be text of up to 4,000 characters.",
  "未知工具。": "This tool is not supported.",
  "JSON 内容无效。": "The JSON content is invalid.",
  "JSON-RPC 请求无效。": "The JSON-RPC request is invalid.",
  "未知方法。": "This method is not supported.",
  "参数无效。": "The arguments are invalid.",
  "操作未完成，请稍后重试": "The action could not be completed. Please try again shortly.",
  "保存失败，请刷新后重试": "Saving failed. Refresh and try again.",
};

/** Translate server validation, preserving unknown technical details for troubleshooting. */
export function translateError(message: string, locale: Locale): string {
  if (locale === "zh") return message;
  const input = message.trim();
  if (errors[input]) return errors[input];
  const field = (name: string) => fieldLabels[name] ?? name;
  let match = input.match(/^(.+) 必须是文本。$/u);
  if (match) return `${field(match[1])} must be text.`;
  match = input.match(/^(.+) 最多 ([\d,]+) 个字符。$/u);
  if (match) return `${field(match[1])} must be ${match[2]} characters or fewer.`;
  match = input.match(/^(.+) 不能为空。$/u);
  if (match) return `${field(match[1])} is required.`;
  match = input.match(/^(.+) 需要 YYYY-MM-DD 格式。$/u);
  if (match) return `${field(match[1])} must use YYYY-MM-DD format.`;
  match = input.match(/^(.+) 不是有效日期。$/u);
  if (match) return `${field(match[1])} must be a valid date.`;
  match = input.match(/^(.+) 必须是布尔值。$/u);
  if (match) return `${field(match[1])} must be a boolean.`;
  if (/failed to fetch|fetch failed|networkerror|network error|load failed|failed to load|connection (?:refused|reset)|econnreset|econnrefused|etimedout/iu.test(input)) {
    return `Could not connect. Check your connection and try again. Details: ${input}`;
  }
  if (!input) return "The action could not be completed. Please try again.";
  if (/[\u3400-\u9fff]/u.test(input)) return `The action could not be completed. Details: ${input}`;
  return input;
}

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (zh: string, en: string) => string;
  shortDate: (date: string) => string;
  statusLabel: (status: JobStatus) => string;
  priorityLabel: (priority: JobPriority) => string;
};
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Start identically on server and client, then restore a saved preference after hydration.
  const [locale, updateLocale] = useState<Locale>("zh");
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") updateLocale(saved);
    } catch { /* Browsers may block preference storage; the current session still works. */ }
    setPreferenceLoaded(true);
    const syncPreference = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && (event.newValue === "zh" || event.newValue === "en")) updateLocale(event.newValue);
    };
    window.addEventListener("storage", syncPreference);
    return () => window.removeEventListener("storage", syncPreference);
  }, []);
  useEffect(() => {
    if (!preferenceLoaded) return;
    try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* Preference storage is optional. */ }
    document.documentElement.lang = locale === "en" ? "en-CA" : "zh-CN";
    document.title = locale === "en" ? "Next Move · Job Search Workspace" : "下一站 · 求职工作台";
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = locale === "en" ? "Organize roles and job descriptions with dot, and track applications, follow-ups, and interviews." : "和 dot 一起整理岗位、保存 JD、追踪投递与面试进度。";
  }, [locale, preferenceLoaded]);
  const setLocale = useCallback((next: Locale) => { if (next === "zh" || next === "en") updateLocale(next); }, []);
  const value = useMemo<I18nValue>(() => ({
    locale, setLocale,
    t: (zh, en) => locale === "en" ? en : zh,
    shortDate: (date) => formatShortDate(date, locale),
    statusLabel: (status) => statusLabelFor(status, locale),
    priorityLabel: (priority) => priorityLabelFor(priority, locale),
  }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider.");
  return value;
}
