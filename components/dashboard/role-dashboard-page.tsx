import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { CustomerDashboardOverview } from "@/components/dashboard/customer/customer-overview";
import { StaffDashboardOverview } from "@/components/dashboard/staff/staff-overview";
import { VendorDashboardOverview } from "@/components/dashboard/vendor/vendor-overview";
import { getCurrentProfile } from "@/lib/convex-server";
import type { Role } from "@/lib/types";

export async function RoleDashboardPage({ role }: { role: Role }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?redirect_url=/dashboard");
  if (profile.role !== role) redirect(`/dashboard/${profile.role}`);

  const overview = role === "admin"
    ? <DashboardOverview role="admin" />
    : role === "customer"
      ? <CustomerDashboardOverview />
      : role === "staff"
        ? <StaffDashboardOverview />
        : <VendorDashboardOverview />;

  return (
    <DashboardShell role={role}>
      {overview}
    </DashboardShell>
  );
}
