import { apiError, getJob, readBody, updateJob } from "../../../../lib/jobs";
import { authenticated, json } from "../../route-utils";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try { const user = await authenticated(); return json({ job: await getJob(user.userId, (await context.params).id) }); }
  catch (error) { return apiError(error); }
}
export async function PATCH(request: Request, context: Context) {
  try { const user = await authenticated(request); return json({ job: await updateJob(user.userId, (await context.params).id, await readBody(request)) }); }
  catch (error) { return apiError(error); }
}
export async function DELETE(request: Request, context: Context) {
  try { const user = await authenticated(request); return json({ job: await updateJob(user.userId, (await context.params).id, { archived: true }) }); }
  catch (error) { return apiError(error); }
}
