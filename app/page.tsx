import JobWorkspace from "@/components/job-workspace";
import { requireChatGPTUser } from "./chatgpt-auth";
export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await requireChatGPTUser("/");
  return <JobWorkspace displayName={user.fullName || "Job seeker"} />;
}
