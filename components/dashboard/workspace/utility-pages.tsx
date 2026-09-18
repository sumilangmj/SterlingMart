"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDate, formatPrice } from "@/lib/format";
import type { Role } from "@/lib/types";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

export function NotificationsPage({ role }: { role: Role }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const notifications = useQuery(api.notifications.list, authLoaded && isSignedIn ? {} : "skip");
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const unread = notifications?.filter((notification) => !notification.read).length ?? 0;
  if (!authLoaded || !isSignedIn || notifications === undefined) return <WorkspaceLoadingState label="notifications" />;
  return (
    <section className="admin-section" aria-labelledby="notifications-heading">
      <AdminPageHeader eyebrow={`${role} workspace`} title="Notifications" description="Keep important account, order, inventory, and system updates in one quiet inbox." action={<button className="admin-button" type="button" disabled={!unread} onClick={() => void markAllRead()}>Mark all read <span aria-hidden="true">✓</span></button>} />
      <div className="notification-list">{notifications?.length ? notifications.map((notification) => <article className={`notification-row${notification.read ? " is-read" : ""}`} key={notification._id}><span className={`notification-mark notification-mark-${notification.kind}`} aria-hidden="true">{notification.kind === "order" ? "▤" : notification.kind === "inventory" ? "◇" : notification.kind === "account" ? "♧" : "✦"}</span><div><h3>{notification.title}</h3><p>{notification.message}</p><small>{formatDate(notification.createdAt)}</small></div>{!notification.read && <button className="admin-table-action" type="button" onClick={() => void markRead({ notificationId: notification._id as Id<"notifications"> })}>Mark read</button>}</article>) : <div className="admin-empty-card">You’re all caught up. New activity will appear here as your workspace changes.</div>}</div>
    </section>
  );
}

export function WorkspaceSearchPage({ role, query }: { role: Role; query: string }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const results = useQuery(api.workspace.search, authLoaded && isSignedIn ? { query } : "skip");
  if (!authLoaded || !isSignedIn || results === undefined) return <WorkspaceLoadingState label="search" />;
  return (
    <section className="admin-section" aria-labelledby="workspace-search-heading">
      <AdminPageHeader eyebrow={`${role} workspace`} title="Search" description={query ? `Results across the ${role} workspace for “${query}”.` : "Search products and orders from your workspace."} />
      {!query ? <div className="admin-empty-card">Enter a search term in the top bar to find products or orders.</div> : <div className="search-results-grid"><article className="admin-table-card search-result-card"><div className="admin-card-heading"><div><p className="admin-card-kicker">Catalog</p><h3>Products</h3></div><span>{results?.products.length ?? 0} matches</span></div>{results?.products.length ? <div className="search-result-list">{results.products.map((product) => <Link className="search-result-row" href={`/products/${product.slug}`} key={product._id}><span><strong>{product.name}</strong><small>{product.category} · {product.collection ?? "Catalog"}</small></span><b>{formatPrice(product.priceCents)}</b></Link>)}</div> : <p className="admin-empty">No products matched this search.</p>}</article><article className="admin-table-card search-result-card"><div className="admin-card-heading"><div><p className="admin-card-kicker">Commerce</p><h3>Orders</h3></div><span>{results?.orders.length ?? 0} matches</span></div>{results?.orders.length ? <div className="search-result-list">{results.orders.map((order) => <Link className="search-result-row" href={`/dashboard/${role}/orders`} key={order.id}><span><strong>#{order.orderNumber} · {order.customer}</strong><small>{order.itemName} · {order.status}</small></span><b>{formatPrice(order.amountCents)}</b></Link>)}</div> : <p className="admin-empty">No orders matched this search.</p>}</article></div>}
    </section>
  );
}
