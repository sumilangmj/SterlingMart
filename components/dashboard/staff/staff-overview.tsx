"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDate, formatPrice } from "@/lib/format";
import { DashboardLink, RoleOverviewLoading, RolePanel, RoleStatCard, RoleStatus } from "@/components/dashboard/role-overview-ui";

export function StaffDashboardOverview() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const data = useQuery(api.staff.overview, authLoaded && isSignedIn ? {} : "skip");
  if (!authLoaded || data === undefined) return <RoleOverviewLoading label="staff operations" />;
  if (!data) return <p className="dashboard-inline-error" role="status">Your operations dashboard is still syncing. Refresh in a moment.</p>;

  return (
    <div className="role-overview role-overview-staff">
      <section className="role-welcome-card staff-welcome-card">
        <div><p className="role-overview-eyebrow">Client experience desk</p><h2>Keep every detail moving.</h2><p>Your shift view brings orders, stock signals, customer messages, and assigned work into one focused queue.</p></div>
        <div className="staff-shift-status"><span className="staff-live-dot" aria-hidden="true" />Live operations<strong>{data.stats.ordersToday} orders today</strong><small>Updates from Convex in real time</small></div>
      </section>

      <section className="role-stat-grid" aria-label="Staff operations summary">
        <RoleStatCard label="Orders in queue" value={String(data.stats.ordersInQueue)} detail={`${data.stats.awaitingDispatch} need dispatch`} icon="▤" />
        <RoleStatCard label="Open tasks" value={String(data.stats.openTasks)} detail="Assigned to you" icon="☷" />
        <RoleStatCard label="Low stock" value={String(data.stats.lowStock)} detail={`${data.stats.inventoryUnits} units on hand`} icon="◇" />
        <RoleStatCard label="New messages" value={String(data.stats.newMessages)} detail="Customer care inbox" icon="✉" />
      </section>

      <div className="role-overview-grid role-overview-grid-staff-main">
        <RolePanel eyebrow="Fulfillment desk" title="Orders needing attention" action={<DashboardLink href="/dashboard/staff/orders">Open order queue</DashboardLink>} className="role-panel-featured">
          {data.queue.length ? <div className="role-list staff-queue-list">{data.queue.map((order) => <Link className="role-list-row" href="/dashboard/staff/orders" key={order.id}><span><strong>#{order.orderNumber} · {order.customer}</strong><small>{order.itemName} · {order.city} · {formatDate(order.createdAt, { month: "short", day: "numeric" })}</small></span><span><RoleStatus status={order.status} /><b>{formatPrice(order.amountCents)}</b></span></Link>)}</div> : <div className="role-empty-state"><span aria-hidden="true">✓</span><h3>The queue is clear.</h3><p>No active orders need an operational handoff right now.</p></div>}
        </RolePanel>

        <RolePanel eyebrow="Assigned work" title="Your task list" action={<DashboardLink href="/dashboard/staff/tasks">View tasks</DashboardLink>}>
          {data.tasks.length ? <div className="role-list staff-task-list">{data.tasks.slice(0, 4).map((task) => <Link className="role-list-row" href="/dashboard/staff/tasks" key={task.id}><span><strong>{task.title}</strong><small>{task.detail}</small></span><span className={`staff-priority staff-priority-${task.priority}`}>{task.priority}</span></Link>)}</div> : <div className="role-empty-state role-empty-state-compact"><span aria-hidden="true">☷</span><h3>No open tasks.</h3><p>New assignments will appear here during your shift.</p></div>}
        </RolePanel>
      </div>

      <div className="role-overview-grid role-overview-grid-staff-lower">
        <RolePanel eyebrow="Stock control" title="Low-stock signals" action={<DashboardLink href="/dashboard/staff/inventory">Review inventory</DashboardLink>}>
          {data.lowStock.length ? <div className="staff-stock-list">{data.lowStock.map((item) => <Link className="staff-stock-row" href="/dashboard/staff/inventory" key={item.id}><span className="staff-stock-indicator" aria-hidden="true">{item.stock <= 7 ? "!" : "·"}</span><span><strong>{item.name}</strong><small>{item.category}</small></span><b>{item.stock} left</b></Link>)}</div> : <p className="role-empty-copy">All live pieces are above the low-stock threshold.</p>}
        </RolePanel>
        <RolePanel eyebrow="Shift shortcuts" title="Go to work">
          <div className="staff-shortcuts"><Link href="/dashboard/staff/orders"><span aria-hidden="true">▤</span><strong>Process orders</strong><small>Update fulfillment status</small></Link><Link href="/dashboard/staff/customers"><span aria-hidden="true">♧</span><strong>Help customers</strong><small>Review account context</small></Link><Link href="/dashboard/staff/tasks"><span aria-hidden="true">☷</span><strong>Plan the shift</strong><small>Manage assigned tasks</small></Link><Link href="/dashboard/staff/analytics"><span aria-hidden="true">◌</span><strong>Read the signal</strong><small>Open performance reports</small></Link></div>
        </RolePanel>
      </div>
    </div>
  );
}
