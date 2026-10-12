import { getChatGPTUser } from "../../chatgpt-auth";
import seed from "../../../lib/seed-jobs.json";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  return Response.json({ jobs: seed, count: seed.length, checkedDate: "2026-10-10" }, { headers: { "Cache-Control": "no-store" } });
}
