import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/convex-server";

export default async function DashboardRouterPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?redirect_url=/dashboard");
  redirect(`/dashboard/${profile.role}`);
}
