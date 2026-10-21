import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "esbuild";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = path.join(root, ".sites-runtime");
await mkdir(runtime, { recursive: true });
const output = path.join(runtime, "i18n-under-test.mjs");
await build({ entryPoints: [path.join(root, "lib/i18n.tsx")], bundle: true, format: "esm", platform: "node", outfile: output, external: ["react", "react/jsx-runtime"] });
const { formatShortDate, translateError, statusLabelFor, priorityLabelFor, I18nProvider, useI18n } = await import(new URL(`../.sites-runtime/i18n-under-test.mjs?run=${Date.now()}`, import.meta.url));

assert.equal(formatShortDate("2026-10-20", "en"), "Oct 20");
assert.equal(formatShortDate("2026-10-20", "zh"), "10月20日");
assert.equal(formatShortDate("2026-01-01", "en"), "Jan 1");
assert.equal(formatShortDate("2026-07-01", "en"), "Jul 1");
// Midnight UTC is still the previous calendar day in Toronto.
assert.equal(formatShortDate("2026-10-20T01:00:00.000Z", "en"), "Oct 19");
assert.equal(formatShortDate("2026-01-01T02:00:00.000Z", "zh"), "12月31日");
assert.equal(formatShortDate("2026-03-08T07:30:00.000Z", "en"), "Mar 8");
assert.equal(formatShortDate("", "en"), "Not set");
assert.equal(formatShortDate("", "zh"), "未设置");
assert.equal(formatShortDate("not-a-date", "en"), "not-a-date");
assert.equal(formatShortDate("2026-02-30", "en"), "2026-02-30");
assert.equal(formatShortDate("2028-02-29", "en"), "Feb 29");

const expectedStatuses = { saved: "To prepare", ready: "Ready to apply", applied: "Applied", screening: "Screening", interview: "Interviewing", offer: "Offer received", rejected: "Not selected", withdrawn: "Withdrawn" };
for (const [status, expected] of Object.entries(expectedStatuses)) {
  assert.equal(statusLabelFor(status, "en"), expected);
  assert.match(statusLabelFor(status, "zh"), /[\u3400-\u9fff]/u);
}
assert.deepEqual(["high", "medium", "low"].map((priority) => priorityLabelFor(priority, "en")), ["High", "Normal", "Backup"]);
assert.deepEqual(["high", "medium", "low"].map((priority) => priorityLabelFor(priority, "zh")), ["优先", "常规", "备选"]);

assert.equal(translateError("该岗位刚刚被更新，请刷新后再保存。", "en"), "This role was just updated. Refresh before saving again.");
assert.equal(translateError("公司和岗位名称必填。", "en"), "Company and role title are required.");
assert.equal(translateError("company 最多 200 个字符。", "en"), "Company must be 200 characters or fewer.");
assert.equal(translateError("标签 不能为空。", "en"), "Tag is required.");
assert.equal(translateError("followUpDate 需要 YYYY-MM-DD 格式。", "en"), "Follow-up date must use YYYY-MM-DD format.");
assert.equal(translateError("appliedAt 不是有效日期。", "en"), "Application date must be a valid date.");
assert.equal(translateError("记录类型 必须是文本。", "en"), "Note type must be text.");
assert.equal(translateError("archived 必须是布尔值。", "en"), "archived must be a boolean.");
const jobsSource = await readFile(path.join(root, "lib/jobs.ts"), "utf8");
const apiSource = await readFile(path.join(root, "app/api/route-utils.ts"), "utf8");
const literalServerErrors = [...`${jobsSource}\n${apiSource}`.matchAll(/new JobError\("([^"\n]+)"/gu)].map((match) => match[1]);
assert.ok(literalServerErrors.length >= 20);
for (const message of literalServerErrors) {
  assert.doesNotMatch(translateError(message, "en"), /[\u3400-\u9fff]/u, `Missing English server error: ${message}`);
  assert.equal(translateError(message, "zh"), message);
}
assert.equal(translateError("HTTP 502: Bad Gateway", "en"), "HTTP 502: Bad Gateway");
assert.match(translateError("Failed to fetch", "en"), /Check your connection.*Details: Failed to fetch/u);
const unknown = "网络请求失败（request-id: abc-123）";
assert.ok(translateError(unknown, "en").startsWith("The action could not be completed."));
assert.ok(translateError(unknown, "en").includes("abc-123"));
assert.ok(translateError(unknown, "en").includes(unknown));
assert.equal(translateError("", "en"), "The action could not be completed. Please try again.");

// The first render must not depend on browser storage or locale. This also keeps
// server markup aligned with the first hydration render before effects restore a preference.
function Probe() {
  const { locale, t, statusLabel } = useI18n();
  return createElement("span", { "data-locale": locale }, `${t("下一站", "Next Move")} / ${statusLabel("applied")}`);
}
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("Storage must not be read during server rendering"); } });
try {
  const markup = renderToStaticMarkup(createElement(I18nProvider, null, createElement(Probe)));
  assert.ok(markup.includes('data-locale="zh"'));
  assert.ok(markup.includes("下一站 / 已投递"));
} finally {
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
  else delete globalThis.localStorage;
}
console.log(JSON.stringify({ passed: true, serverErrorCases: literalServerErrors.length, checks: ["Toronto calendar dates and timestamps", "invalid and empty dates", "complete status and priority labels", "server validation errors", "unknown diagnostics preserved", "storage-independent Chinese SSR default"] }));
