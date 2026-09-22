"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Role } from "@/lib/types";
import { BrandLogo } from "@/components/branding/brand-logo";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

const roleLabels: Record<Role, string> = {
  customer: "Customer",
  staff: "Staff",
  vendor: "Vendor",
  admin: "Administrator",
};

const dashboardNav: Record<Role, Array<{ label: string; icon: string; href: string }>> = {
  admin: [
    { label: "Dashboard", icon: "⌂", href: "/dashboard/admin" },
    { label: "Orders", icon: "▤", href: "/dashboard/admin/orders" },
    { label: "Products", icon: "◇", href: "/dashboard/admin/products" },
    { label: "Collections", icon: "▦", href: "/dashboard/admin/collections" },
    { label: "Customers", icon: "♧", href: "/dashboard/admin/customers" },
    { label: "Inventory", icon: "▥", href: "/dashboard/admin/inventory" },
    { label: "Marketing", icon: "✦", href: "/dashboard/admin/marketing" },
    { label: "Analytics", icon: "◌", href: "/dashboard/admin/analytics" },
    { label: "Messages", icon: "✉", href: "/dashboard/admin/messages" },
    { label: "Site content", icon: "Aa", href: "/dashboard/admin/content" },
    { label: "Settings", icon: "⚙", href: "/dashboard/admin/settings" },
  ],
  staff: [
    { label: "Dashboard", icon: "⌂", href: "/dashboard/staff" },
    { label: "Orders", icon: "▤", href: "/dashboard/staff/orders" },
    { label: "Products", icon: "◇", href: "/dashboard/staff/products" },
    { label: "Collections", icon: "▦", href: "/dashboard/staff/collections" },
    { label: "Customers", icon: "♧", href: "/dashboard/staff/customers" },
    { label: "Inventory", icon: "▥", href: "/dashboard/staff/inventory" },
    { label: "Marketing", icon: "✦", href: "/dashboard/staff/marketing" },
    { label: "Analytics", icon: "◌", href: "/dashboard/staff/analytics" },
    { label: "Tasks", icon: "☷", href: "/dashboard/staff/tasks" },
    { label: "Settings", icon: "⚙", href: "/dashboard/staff/settings" },
  ],
  vendor: [
    { label: "Dashboard", icon: "⌂", href: "/dashboard/vendor" },
    { label: "Orders", icon: "▤", href: "/dashboard/vendor/orders" },
    { label: "Products", icon: "◇", href: "/dashboard/vendor/products" },
    { label: "Collections", icon: "▦", href: "/dashboard/vendor/collections" },
    { label: "Inventory", icon: "▥", href: "/dashboard/vendor/inventory" },
    { label: "Marketing", icon: "✦", href: "/dashboard/vendor/marketing" },
    { label: "Analytics", icon: "◌", href: "/dashboard/vendor/analytics" },
    { label: "Settings", icon: "⚙", href: "/dashboard/vendor/settings" },
  ],
  customer: [
    { label: "Dashboard", icon: "⌂", href: "/dashboard/customer" },
    { label: "Orders", icon: "▤", href: "/dashboard/customer/orders" },
    { label: "Products", icon: "◇", href: "/dashboard/customer/products" },
    { label: "Collections", icon: "▦", href: "/dashboard/customer/collections" },
    { label: "Saved pieces", icon: "♡", href: "/dashboard/customer/saved-pieces" },
    { label: "Settings", icon: "⚙", href: "/dashboard/customer/settings" },
  ],
};

const greeting: Record<Role, string> = {
  admin: "Good morning, Admin",
  staff: "Good morning, team",
  vendor: "Good morning, atelier",
  customer: "Welcome back",
};

const shellCopy: Record<Role, { eyebrow: string; context: string; period: string; railNote: string[]; search: string }> = {
  admin: { eyebrow: "Overview", context: "Here’s what’s happening with your store today.", period: "Oct 1, 2024 — Oct 31, 2024", railNote: ["Beauty", "lives longer"], search: "Search products, orders, or customers..." },
  staff: { eyebrow: "Operations desk", context: "Keep orders, stock signals, and customer care moving through the shift.", period: "Live operations", railNote: ["Every detail", "in motion"], search: "Search orders, products, or customers..." },
  vendor: { eyebrow: "Atelier portal", context: "Track your catalog, fulfillment handoffs, and partnership performance.", period: "Your catalog", railNote: ["Made by you", "shaped to last"], search: "Search your catalog or orders..." },
  customer: { eyebrow: "My account", context: "Your saved pieces, orders, and recommendations in one private room.", period: "Personal account", railNote: ["Your collection", "your story"], search: "Search your saved pieces..." },
};

function pageTitle(activePage: string) {
  if (activePage === "dashboard") return "Overview";
  return activePage.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function DashboardShell({ role, activePage = "dashboard", children }: { role: Role; activePage?: string; children: ReactNode }) {
  const title = pageTitle(activePage);
  const copy = shellCopy[role];
  const pathname = usePathname();
  const [navigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNavigationOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("dashboard-menu-open", navigationOpen);
    return () => document.body.classList.remove("dashboard-menu-open");
  }, [navigationOpen]);

  const closeNavigation = () => setNavigationOpen(false);

  return (
    <section className={`dashboard-page dashboard-page-${role}${navigationOpen ? " is-navigation-open" : ""}`} data-role={role} data-scroll-reveal="dashboard" aria-labelledby="dashboard-heading">
      {navigationOpen && <button className="dashboard-sidebar-scrim" type="button" aria-label="Close dashboard navigation" onClick={closeNavigation} />}
      <aside className="dashboard-rail" id="dashboard-navigation" aria-label={`${roleLabels[role]} dashboard navigation`}>
        <div className="dashboard-rail-header">
          <Link className="dashboard-brand" href="/" aria-label="SM Sterling Mart storefront" onClick={closeNavigation}>
            <BrandLogo className="dashboard-brand-logo" priority />
            <span className="dashboard-brand-tagline">Fine jewelry<br />for brighter tomorrows</span>
          </Link>
          <button className="dashboard-rail-close" type="button" aria-label="Close dashboard navigation" onClick={closeNavigation}>×</button>
        </div>
        <nav className="dashboard-nav" aria-label={`${roleLabels[role]} dashboard navigation`}>
          {dashboardNav[role].map((item) => { const itemKey = item.label.toLowerCase().replaceAll(" ", "-"); return <Link className={`dashboard-nav-item${itemKey === activePage ? " active" : ""}`} href={item.href} key={item.label} onClick={closeNavigation}><span className="dashboard-nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></Link>; })}
        </nav>
        <div className="dashboard-rail-note">
          <span className="dashboard-rail-rule" aria-hidden="true" />
          <p>{copy.railNote[0]}<br />{copy.railNote[1]}</p>
          <span className="dashboard-rail-rule dashboard-rail-rule-bottom" aria-hidden="true" />
        </div>
      </aside>
      <div className="dashboard-workspace">
        <DashboardTopbar role={role} menuOpen={navigationOpen} onMenuToggle={() => setNavigationOpen((current) => !current)} />
        <div className="dashboard-main">
          <div className="dashboard-content">
            <div className="dashboard-heading-row">
              <div>
                <p className="dashboard-page-kicker">{activePage === "dashboard" ? copy.eyebrow : `${roleLabels[role]} workspace`}</p>
                <h1 id="dashboard-heading">{title}</h1>
                <p className="dashboard-subtitle">{greeting[role]}</p>
                <p className="dashboard-context">{copy.context}</p>
              </div>
              <p className="dashboard-slogan">TIMELESS JEWELRY<br />EXCEPTIONAL JOURNEYS<i aria-hidden="true" /></p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
