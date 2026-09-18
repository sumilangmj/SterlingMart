"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/format";
import type { Role } from "@/lib/types";

type Modal = "search" | "period" | "notifications" | "account" | null;
type Period = "7D" | "30D" | "3M" | "6M" | "1Y";

const roleLabels: Record<Role, string> = { customer: "Customer", staff: "Staff", vendor: "Vendor", admin: "Administrator" };
const periods: Array<{ key: Period; label: string; detail: string }> = [
  { key: "7D", label: "Last 7 days", detail: "A focused look at this week" },
  { key: "30D", label: "Last 30 days", detail: "The current operating view" },
  { key: "3M", label: "Last 3 months", detail: "A broader performance signal" },
  { key: "6M", label: "Last 6 months", detail: "Seasonal context for decisions" },
  { key: "1Y", label: "Last 12 months", detail: "The full year at a glance" },
];

const roleQuickLinks: Record<Role, Array<{ label: string; href: string; detail: string }>> = {
  customer: [
    { label: "Orders", href: "/dashboard/customer/orders", detail: "Follow your pieces" },
    { label: "Saved pieces", href: "/dashboard/customer/saved-pieces", detail: "Your private edit" },
    { label: "Settings", href: "/dashboard/customer/settings", detail: "Delivery and preferences" },
  ],
  staff: [
    { label: "Tasks", href: "/dashboard/staff/tasks", detail: "Your assigned work" },
    { label: "Orders", href: "/dashboard/staff/orders", detail: "Fulfillment queue" },
    { label: "Settings", href: "/dashboard/staff/settings", detail: "Shift preferences" },
  ],
  vendor: [
    { label: "Products", href: "/dashboard/vendor/products", detail: "Your managed catalog" },
    { label: "Orders", href: "/dashboard/vendor/orders", detail: "Fulfillment handoffs" },
    { label: "Settings", href: "/dashboard/vendor/settings", detail: "Partnership profile" },
  ],
  admin: [
    { label: "Customers", href: "/dashboard/admin/customers", detail: "Account and role records" },
    { label: "Content", href: "/dashboard/admin/content", detail: "Storefront messaging" },
    { label: "Settings", href: "/dashboard/admin/settings", detail: "Store configuration" },
  ],
};

export function DashboardTopbar({ role, period = "30D" }: { role: Role; period?: Period }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(period);
  const [search, setSearch] = useState("");
  const dialogInputRef = useRef<HTMLInputElement>(null);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const notifications = useQuery(api.notifications.list, authLoaded && isSignedIn && modal === "notifications" ? {} : "skip");
  const markRead = useMutation(api.notifications.markRead);
  const unread = notifications?.filter((notification) => !notification.read).length ?? 0;

  useEffect(() => {
    if (modal === "search") dialogInputRef.current?.focus();
    else if (modal) dialogCloseRef.current?.focus();
  }, [modal]);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setModal(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal]);

  function openSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setModal("search");
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    if (query) router.push(`/dashboard/${role}/search?q=${encodeURIComponent(query)}`);
  }

  function selectPeriod(nextPeriod: Period) {
    setSelectedPeriod(nextPeriod);
    window.dispatchEvent(new CustomEvent<Period>("sterling-period-change", { detail: nextPeriod }));
    setModal(null);
  }

  const currentPeriod = periods.find((item) => item.key === selectedPeriod) ?? periods[1];
  return (
    <>
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-brand" aria-hidden="true" />
        <div className="dashboard-topbar-actions">
          <form className="dashboard-search" onSubmit={openSearch} role="search">
            <label className="sr-only" htmlFor={`dashboard-search-trigger-${role}`}>Search products, orders, or customers</label>
            <span className="dashboard-search-icon" aria-hidden="true">⌕</span>
            <input id={`dashboard-search-trigger-${role}`} readOnly value="" onClick={() => setModal("search")} placeholder={role === "customer" ? "Search your saved pieces..." : role === "vendor" ? "Search your catalog or orders..." : role === "staff" ? "Search orders, products, or customers..." : "Search products, orders, or customers..."} />
          </form>
          <button className="dashboard-date" type="button" aria-haspopup="dialog" aria-expanded={modal === "period"} onClick={() => setModal("period")}><span aria-hidden="true">{role === "customer" ? "♡" : role === "vendor" ? "◇" : role === "staff" ? "◌" : "▣"}</span><span>{role === "admin" ? "Reporting" : "Workspace"}: {currentPeriod.key}</span><b aria-hidden="true">⌄</b></button>
          <button className="dashboard-notification" type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-haspopup="dialog" aria-expanded={modal === "notifications"} onClick={() => setModal("notifications")}><span aria-hidden="true">♧</span>{unread > 0 && <span className="dashboard-notification-dot" aria-label={`${unread} unread`} />}</button>
          <div className="dashboard-user">
            <div className="dashboard-user-control"><UserButton /></div>
            <button className="dashboard-user-trigger" type="button" aria-haspopup="dialog" aria-expanded={modal === "account"} onClick={() => setModal("account")}><span className={`dashboard-user-avatar dashboard-user-avatar-${role}`} aria-hidden="true">{role === "admin" ? "S" : role.charAt(0).toUpperCase()}</span><span className="dashboard-user-copy"><strong>{role === "admin" ? "Store Admin" : `${roleLabels[role]} Account`}</strong><span>{roleLabels[role]}</span></span><span className="dashboard-user-chevron" aria-hidden="true">⌄</span></button>
          </div>
        </div>
      </header>

      {modal && <div className="dashboard-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <section className={`dashboard-modal dashboard-modal-${modal}`} role="dialog" aria-modal="true" aria-labelledby={`dashboard-modal-title-${modal}`}>
          <div className="dashboard-modal-heading"><div><p className="dashboard-modal-kicker">{modal === "search" ? "Workspace search" : modal === "period" ? "Reporting context" : modal === "notifications" ? "Quiet inbox" : "Account room"}</p><h2 id={`dashboard-modal-title-${modal}`}>{modal === "search" ? "Find anything" : modal === "period" ? "Choose a period" : modal === "notifications" ? "Notifications" : "Your SterlingMart account"}</h2></div><button ref={dialogCloseRef} className="dashboard-modal-close" type="button" aria-label="Close dialog" onClick={() => setModal(null)}>×</button></div>

          {modal === "search" && <form className="dashboard-modal-search-form" onSubmit={submitSearch}><label htmlFor="dashboard-search-dialog">Search this workspace</label><div><span aria-hidden="true">⌕</span><input ref={dialogInputRef} id="dashboard-search-dialog" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try rings, orders, or a customer name" /></div><p>Search results stay inside your {roleLabels[role].toLowerCase()} workspace.</p><button className="dashboard-modal-primary" type="submit" disabled={!search.trim()}>Search workspace <span aria-hidden="true">↗</span></button></form>}

          {modal === "period" && <div className="dashboard-period-options">{periods.map((item) => <button className={`dashboard-period-option${item.key === selectedPeriod ? " is-selected" : ""}`} type="button" key={item.key} onClick={() => selectPeriod(item.key)}><span><strong>{item.label}</strong><small>{item.detail}</small></span><b aria-hidden="true">{item.key === selectedPeriod ? "✓" : "→"}</b></button>)}</div>}

          {modal === "notifications" && <div className="dashboard-notification-modal-content">{!authLoaded || (isSignedIn && notifications === undefined) ? <p className="dashboard-modal-loading">Loading your latest updates…</p> : !isSignedIn ? <p className="dashboard-modal-empty">Sign in again to view workspace notifications.</p> : notifications?.length ? <div className="dashboard-notification-list">{notifications.slice(0, 6).map((notification) => <article className={`dashboard-notification-row${notification.read ? " is-read" : ""}`} key={notification._id}><span className={`dashboard-notification-mark dashboard-notification-mark-${notification.kind}`} aria-hidden="true">{notification.kind === "order" ? "▤" : notification.kind === "inventory" ? "◇" : notification.kind === "account" ? "♧" : "✦"}</span><div><strong>{notification.title}</strong><p>{notification.message}</p><small>{formatDate(notification.createdAt)}</small></div>{!notification.read && <button type="button" onClick={() => void markRead({ notificationId: notification._id })}>Mark read</button>}</article>)}</div> : <p className="dashboard-modal-empty">You’re all caught up. New activity will appear here as your workspace changes.</p>}<Link className="dashboard-modal-secondary" href={`/dashboard/${role}/notifications`} onClick={() => setModal(null)}>Open notification center <span aria-hidden="true">↗</span></Link></div>}

          {modal === "account" && <div className="dashboard-account-modal-content"><div className="dashboard-account-intro"><span className={`dashboard-account-avatar dashboard-user-avatar-${role}`} aria-hidden="true">{role === "admin" ? "S" : role.charAt(0).toUpperCase()}</span><div><strong>{role === "admin" ? "Store Admin" : `${roleLabels[role]} Account`}</strong><p>{roleQuickLinks[role][0].detail}</p></div></div><div className="dashboard-account-links">{roleQuickLinks[role].map((item) => <Link href={item.href} key={item.href} onClick={() => setModal(null)}><span><strong>{item.label}</strong><small>{item.detail}</small></span><b aria-hidden="true">↗</b></Link>)}</div><div className="dashboard-account-footer"><Link className="dashboard-modal-secondary" href="/" onClick={() => setModal(null)}>Return to storefront <span aria-hidden="true">↗</span></Link><div className="dashboard-clerk-control"><span>Account controls</span><UserButton /></div></div></div>}
        </section>
      </div>}
    </>
  );
}
