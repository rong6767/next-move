import { apiError, createJob, filtersFromUrl, listJobs, readBody } from "../../../lib/jobs";
import { authenticated, json } from "../route-utils";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await authenticated();
    const jobs = await listJobs(user.userId, filtersFromUrl(new URL(request.url)));
    return json({ jobs, user: { displayName: user.displayName, email: user.email } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await authenticated(request);
    return json({ job: await createJob(user.userId, await readBody(request)) }, 201);
  } catch (error) { return apiError(error); }
}
