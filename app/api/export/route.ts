import { apiError, listJobs } from "../../../lib/jobs";
import { authenticated } from "../route-utils";
import { todayDate } from "../../../lib/job-types";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await authenticated();
    return Response.json({ format: "dot-career/v1", exportedAt: new Date().toISOString(), jobs: await listJobs(user.userId, { archived: "all" }) }, {
      headers: { "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="dot-career-${todayDate()}.json"` },
    });
  } catch (error) { return apiError(error); }
}
