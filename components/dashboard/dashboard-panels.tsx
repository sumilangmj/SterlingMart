"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";

export type DashboardRange = "7D" | "30D" | "3M" | "6M" | "1Y";
export type DashboardTrend = { label: string; valueCents: number };
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type DashboardOrder = { id: string; orderNumber: string; customer: string; amountCents: number; status: string; createdAt: number; itemName: string };
export type TopPiece = { id: string; slug: string; name: string; imageUrl: string; priceCents: number; stock: number; unitsSold: number; featured: boolean };
export type LowStockItem = { id: string; name: string; stock: number; category: string };
export type CustomerActivity = { id: string; initials: string; customer: string; action: string; itemName: string; createdAt: number };
export type StaffTask = { _id: string; title: string; detail: string; type: string; status: string; priority: string; updatedAt: number };

const statusOptions: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

function shortDate(timestamp: number) {
  return formatDate(timestamp);
}

export function SalesOverTimePanel({ range, trend, revenueCents, onRangeChange }: { range: DashboardRange; trend: DashboardTrend[]; revenueCents: number; onRangeChange: (range: DashboardRange) => void }) {
  const maxValue = Math.max(...trend.map((point) => point.valueCents), 1);
  const points = trend.length ? trend.map((point, index) => `${(index / Math.max(trend.length - 1, 1)) * 100},${100 - (point.valueCents / maxValue) * 82}`).join(" ") : "0,80 16,58 32,68 48,38 64,52 82,26 100,12";
  const areaPoints = `${points} 100,100 0,100`;

  return (
    <section className="dashboard-card dashboard-sales-card" id="revenue" aria-labelledby="sales-heading">
      <div className="dashboard-card-heading">
        <div><p className="dashboard-card-kicker">Performance</p><h2 id="sales-heading">Sales over time</h2></div>
        <select className="dashboard-card-select" aria-label="Sales range" value={range} onChange={(event) => onRangeChange(event.target.value as DashboardRange)}>{["7D", "30D", "3M", "6M", "1Y"].map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      <div className="dashboard-sales-total"><strong>{formatPrice(revenueCents)}</strong><span>Live selected range</span></div>
      <div className="dashboard-sales-chart" role="img" aria-label={`Sales trend for the selected ${range} range`}>
        <div className="dashboard-sales-y" aria-hidden="true"><span>$12K</span><span>$9K</span><span>$6K</span><span>$3K</span><span>$0</span></div>
        <div className="dashboard-sales-plot">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon className="dashboard-sales-area" points={areaPoints} /><polyline className="dashboard-sales-line" points={points} /></svg>
          {trend.map((point, index) => <span className="dashboard-sales-dot" key={`${point.label}-${index}`} style={{ left: `${(index / Math.max(trend.length - 1, 1)) * 100}%`, top: `${100 - (point.valueCents / maxValue) * 82}%` }} />)}
          <span className="dashboard-sales-tooltip" aria-hidden="true"><small>{trend.at(-1)?.label ?? "Today"}</small><strong>{formatPrice(trend.at(-1)?.valueCents ?? revenueCents)}</strong></span>
          <div className="dashboard-sales-x" aria-hidden="true">{trend.map((point) => <span key={point.label}>{point.label}</span>)}</div>
        </div>
      </div>
    </section>
  );
}

export function TopPiecesPanel({ pieces, canManageCatalog, busyProduct, onToggleFeatured, onOpenPiece, viewHref }: { pieces: TopPiece[]; canManageCatalog: boolean; busyProduct: string | null; onToggleFeatured: (productId: string) => void; onOpenPiece: (piece: TopPiece) => void; viewHref: string }) {
  return (
    <section className="dashboard-card dashboard-top-pieces-card" id="top-pieces" aria-labelledby="top-pieces-heading">
      <div className="dashboard-card-heading"><div><p className="dashboard-card-kicker">Merchandising</p><h2 id="top-pieces-heading">Top pieces</h2></div><Link className="dashboard-view-link" href={viewHref}>View all <span aria-hidden="true">↗</span></Link></div>
      <div className="dashboard-piece-grid">
        {pieces.length ? pieces.map((piece) => <article className="dashboard-piece" key={piece.id}>
          <Link className="dashboard-piece-image" href={`/products/${piece.slug}`}>
            <Image src={piece.imageUrl} alt={piece.name} fill sizes="(max-width: 700px) 30vw, 18vw" />
          </Link>
          <div className="dashboard-piece-copy"><strong>{piece.name}</strong><span>{piece.unitsSold} sold · {piece.stock} available</span><b>{formatPrice(piece.priceCents)}</b><button className="dashboard-piece-quick-view" type="button" onClick={() => onOpenPiece(piece)}>Quick view <span aria-hidden="true">↗</span></button></div>
          {canManageCatalog && <button className={`dashboard-piece-feature${piece.featured ? " is-featured" : ""}`} disabled={busyProduct === `featured:${piece.id}`} onClick={() => onToggleFeatured(piece.id)} type="button" aria-label={`${piece.featured ? "Remove" : "Add"} ${piece.name} ${piece.featured ? "from" : "to"} the signature edit`}>{busyProduct === `featured:${piece.id}` ? "…" : piece.featured ? "★" : "☆"}</button>}
        </article>) : <p className="dashboard-empty-inline">Top pieces will appear once the catalog loads.</p>}
      </div>
    </section>
  );
}

export function RecentOrdersPanel({ orders, canUpdateOrders, busyOrder, onStatusChange, viewHref }: { orders: DashboardOrder[]; canUpdateOrders: boolean; busyOrder: string | null; onStatusChange: (orderId: string, status: OrderStatus) => void; viewHref: string }) {
  return (
    <section className="dashboard-card dashboard-recent-orders-card" id="recent-orders" aria-labelledby="recent-orders-heading">
      <div className="dashboard-card-heading"><div><p className="dashboard-card-kicker">Commerce</p><h2 id="recent-orders-heading">Recent orders</h2></div><Link className="dashboard-view-link" href={viewHref}>View all <span aria-hidden="true">↗</span></Link></div>
      <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th scope="col">#</th><th scope="col">Customer</th><th scope="col">Product</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col">Date</th></tr></thead><tbody>{orders.length ? orders.map((order) => <tr key={order.id}><td>#{order.orderNumber}</td><td>{order.customer}</td><td><span className="dashboard-table-product"><i aria-hidden="true">✦</i>{order.itemName}</span></td><td>{formatPrice(order.amountCents)}</td><td>{canUpdateOrders ? <select className={`dashboard-status dashboard-status-${order.status}`} aria-label={`Status for order ${order.orderNumber}`} disabled={busyOrder === order.id} value={order.status} onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}>{statusOptions.map((status) => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}</select> : <span className={`dashboard-status dashboard-status-${order.status}`}>{order.status}</span>}</td><td>{shortDate(order.createdAt)}</td></tr>) : <tr><td colSpan={6}><span className="dashboard-empty-inline">No orders in this view yet.</span></td></tr>}</tbody></table></div>
    </section>
  );
}

export function InventoryAlertsPanel({ items, canManageCatalog, stockDrafts, busyProduct, onStockDraftChange, onStockSave, viewHref }: { items: LowStockItem[]; canManageCatalog: boolean; stockDrafts: Record<string, string>; busyProduct: string | null; onStockDraftChange: (productId: string, stock: string) => void; onStockSave: (productId: string, currentStock: number) => void; viewHref: string }) {
  return (
    <section className="dashboard-card dashboard-alerts-card" id="inventory-alerts" aria-labelledby="alerts-heading">
      <div className="dashboard-card-heading"><div><p className="dashboard-card-kicker">Inventory</p><h2 id="alerts-heading">Inventory alerts</h2></div><Link className="dashboard-view-link" href={viewHref}>View all <span aria-hidden="true">↗</span></Link></div>
      <div className="dashboard-alert-list">{items.length ? items.map((item) => <div className="dashboard-alert-row" key={item.id}><span className="dashboard-alert-mark" aria-hidden="true">◇</span><div><strong>{item.name}</strong><span>{item.stock <= 7 ? "Critical" : "Low stock"} · {item.stock} left</span></div>{canManageCatalog ? <form className="dashboard-alert-form" onSubmit={(event) => { event.preventDefault(); onStockSave(item.id, item.stock); }}><label className="sr-only" htmlFor={`alert-stock-${item.id}`}>Stock for {item.name}</label><input id={`alert-stock-${item.id}`} min="0" inputMode="numeric" type="number" value={stockDrafts[item.id] ?? item.stock} onChange={(event) => onStockDraftChange(item.id, event.target.value)} /><button type="submit" disabled={busyProduct === `stock:${item.id}`}>{busyProduct === `stock:${item.id}` ? "…" : "Save"}</button></form> : <span className={`dashboard-alert-pill${item.stock <= 7 ? " is-critical" : ""}`}>{item.stock <= 7 ? "Critical" : "Low stock"}</span>}</div>) : <p className="dashboard-empty-inline">No inventory alerts at this time.</p>}</div>
    </section>
  );
}

export function CustomerActivityPanel({ activity, viewHref }: { activity: CustomerActivity[]; viewHref: string }) {
  return (
    <section className="dashboard-card dashboard-activity-card" id="customer-activity" aria-labelledby="activity-heading">
      <div className="dashboard-card-heading"><div><p className="dashboard-card-kicker">Community</p><h2 id="activity-heading">Customer activity</h2></div><Link className="dashboard-view-link" href={viewHref}>View all <span aria-hidden="true">↗</span></Link></div>
      <div className="dashboard-activity-list">{activity.length ? activity.map((entry) => <div className="dashboard-activity-row" key={entry.id}><span className="dashboard-activity-avatar" aria-hidden="true">{entry.initials}</span><div><strong>{entry.customer}</strong><span>{entry.action} · {formatDate(entry.createdAt, { month: "short", day: "numeric" })}</span><small>{entry.itemName}</small></div></div>) : <p className="dashboard-empty-inline">Customer activity will appear here as orders arrive.</p>}</div>
    </section>
  );
}

export function StaffTasksPanel({ tasks, busyTask, onStatusChange }: { tasks: StaffTask[]; busyTask: string | null; onStatusChange: (taskId: string, status: "open" | "in_progress" | "done") => void }) {
  return (
    <section className="dashboard-card dashboard-tasks-card" id="staff-tasks" aria-labelledby="staff-tasks-heading">
      <div className="dashboard-card-heading"><div><p className="dashboard-card-kicker">Operations</p><h2 id="staff-tasks-heading">Staff tasks</h2></div><Link className="dashboard-view-link" href="/dashboard/staff/tasks">Open workspace <span aria-hidden="true">↗</span></Link></div>
      <div className="dashboard-task-list">{tasks.length ? tasks.slice(0, 4).map((task) => <div className="dashboard-task-row" key={task._id}><span className={`dashboard-task-priority dashboard-task-priority-${task.priority}`} aria-hidden="true">{task.priority === "high" ? "!" : "·"}</span><div><strong>{task.title}</strong><span>{task.detail || task.type}</span></div><select aria-label={`Status for ${task.title}`} className="dashboard-status dashboard-status-pending" disabled={busyTask === task._id} value={task.status} onChange={(event) => onStatusChange(task._id, event.target.value as "open" | "in_progress" | "done")}><option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option></select></div>) : <p className="dashboard-empty-inline">No assigned tasks. The queue is clear.</p>}</div>
    </section>
  );
}
