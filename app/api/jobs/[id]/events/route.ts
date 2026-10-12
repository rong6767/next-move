import { addJobEvent, apiError, readBody } from "../../../../../lib/jobs";
import { authenticated, json } from "../../../route-utils";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticated(request);
    return json({ job: await addJobEvent(user.userId, (await context.params).id, await readBody(request)) }, 201);
  } catch (error) { return apiError(error); }
}
