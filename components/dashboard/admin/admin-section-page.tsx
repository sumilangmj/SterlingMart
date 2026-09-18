import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AdminAnalyticsPage } from "@/components/dashboard/admin/admin-analytics-page";
import { AdminCollectionsPage } from "@/components/dashboard/admin/admin-collections-page";
import { AdminCustomersPage } from "@/components/dashboard/admin/admin-customers-page";
import { AdminInventoryPage } from "@/components/dashboard/admin/admin-inventory-page";
import { AdminMarketingPage } from "@/components/dashboard/admin/admin-marketing-page";
import { AdminMessagesPage } from "@/components/dashboard/admin/admin-messages-page";
import { AdminOrdersPage } from "@/components/dashboard/admin/admin-orders-page";
import { AdminProductsPage } from "@/components/dashboard/admin/admin-products-page";
import { AdminSiteContentPage } from "@/components/dashboard/admin/admin-site-content-page";
import { AdminSettingsPage } from "@/components/dashboard/admin/admin-settings-page";
import { getCurrentProfile } from "@/lib/convex-server";

export type AdminSection = "orders" | "products" | "collections" | "customers" | "inventory" | "marketing" | "analytics" | "messages" | "content" | "settings";

export async function AdminSectionPage({ section }: { section: AdminSection }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/sign-in?redirect_url=/dashboard/admin/${section}`);
  if (profile.role !== "admin") redirect(`/dashboard/${profile.role}`);

  const page = {
    orders: <AdminOrdersPage />,
    products: <AdminProductsPage />,
    collections: <AdminCollectionsPage />,
    customers: <AdminCustomersPage />,
    inventory: <AdminInventoryPage />,
    marketing: <AdminMarketingPage />,
    analytics: <AdminAnalyticsPage />,
    messages: <AdminMessagesPage />,
    content: <AdminSiteContentPage />,
    settings: <AdminSettingsPage />,
  }[section];

  return <DashboardShell activePage={section} role="admin">{page}</DashboardShell>;
}
