import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/convex-server";
import type { Role } from "@/lib/types";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NotificationsPage, WorkspaceSearchPage } from "@/components/dashboard/workspace/utility-pages";
import { CustomerWorkspace } from "@/components/dashboard/customer/customer-workspace";
import { StaffWorkspace } from "@/components/dashboard/staff/staff-workspace";
import { VendorWorkspace } from "@/components/dashboard/vendor/vendor-workspace";

export type CustomerSection = "orders" | "products" | "collections" | "saved-pieces" | "settings";
export type StaffSection = "orders" | "products" | "collections" | "customers" | "inventory" | "marketing" | "analytics" | "settings" | "tasks";
export type VendorSection = "orders" | "products" | "collections" | "inventory" | "marketing" | "analytics" | "settings";
export type RoleSection = CustomerSection | StaffSection | VendorSection | "notifications" | "search";

export async function RoleSectionPage({ role, section, query = "" }: { role: Role; section: RoleSection; query?: string }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/sign-in?redirect_url=/dashboard/${role}/${section}`);
  if (profile.role !== role) redirect(`/dashboard/${profile.role}`);
  const content = section === "notifications" ? <NotificationsPage role={role} /> : section === "search" ? <WorkspaceSearchPage role={role} query={query} /> : role === "customer" ? <CustomerWorkspace section={section as CustomerSection} /> : role === "staff" ? <StaffWorkspace section={section as StaffSection} /> : role === "vendor" ? <VendorWorkspace section={section as VendorSection} /> : null;
  return <DashboardShell role={role} activePage={section}>{content}</DashboardShell>;
}
