"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

const statusOptions = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof statusOptions)[number];

export function AdminOrdersPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const canQueryProtectedData = authLoaded && isSignedIn;
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const orders = useQuery(api.admin.orders, canQueryProtectedData ? { status: status || undefined } : "skip");
  const updateStatus = useMutation(api.orders.updateStatus);
  const visibleOrders = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (orders ?? []).filter((order) => !needle || `${order.orderNumber} ${order.customer} ${order.email} ${order.itemName}`.toLowerCase().includes(needle));
  }, [orders, search]);

  if (!canQueryProtectedData || orders === undefined) return <WorkspaceLoadingState label="orders" />;

  async function changeStatus(orderId: string, nextStatus: OrderStatus) {
    setBusyOrder(orderId);
    setError(null);
    try {
      await updateStatus({ orderId: orderId as Id<"orders">, status: nextStatus });
    } catch {
      setError("The order status could not be saved.");
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-orders-heading">
      <AdminPageHeader eyebrow="Commerce operations" title="Orders" description="Review every jewelry order and move fulfillment forward from one queue." />
      <div className="admin-toolbar"><label className="admin-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search orders</span><input type="search" placeholder="Search customer, order, or product" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="admin-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | "")}><option value="">All statuses</option>{statusOptions.map((option) => <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>)}</select></label></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-table-card"><table className="admin-table"><thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Piece</th><th scope="col">Total</th><th scope="col">Destination</th><th scope="col">Status</th><th scope="col">Placed</th></tr></thead><tbody>{visibleOrders.length ? visibleOrders.map((order) => <tr key={order.id}><td className="admin-order-number">#{order.orderNumber}</td><td><strong>{order.customer}</strong><small>{order.email}</small></td><td><strong>{order.itemName}</strong><small>{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</small></td><td>{formatPrice(order.amountCents)}</td><td>{order.city}</td><td><select className={`admin-status admin-status-${order.status}`} aria-label={`Status for order ${order.orderNumber}`} value={order.status} disabled={busyOrder === order.id} onChange={(event) => void changeStatus(order.id, event.target.value as OrderStatus)}>{statusOptions.map((option) => <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>)}</select></td><td>{formatDate(order.createdAt)}</td></tr>) : <tr><td colSpan={7}><span className="admin-empty">No orders match this view.</span></td></tr>}</tbody></table></div>
    </section>
  );
}
