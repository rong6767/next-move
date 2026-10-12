import { apiError, importJobs, readBody } from "../../../lib/jobs";
import { authenticated, json } from "../route-utils";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try { const user = await authenticated(request); return json(await importJobs(user.userId, await readBody(request)), 201); }
  catch (error) { return apiError(error); }
}
