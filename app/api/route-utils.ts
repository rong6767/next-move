import { getChatGPTUser } from "../chatgpt-auth";
import { assertBrowserWrite, JobError } from "../../lib/jobs";

export async function authenticated(request?: Request) {
  const user = await getChatGPTUser();
  if (!user) throw new JobError("请先使用 ChatGPT 登录。", 401, "AUTH_REQUIRED");
  if (request) assertBrowserWrite(request);
  return user;
}
export function json(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}
