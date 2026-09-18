"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/format";
import { DashboardLink, RoleOverviewLoading, RolePanel, RoleStatCard, RoleStatus } from "@/components/dashboard/role-overview-ui";

export function VendorDashboardOverview() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const data = useQuery(api.vendor.overview, authLoaded && isSignedIn ? {} : "skip");
  if (!authLoaded || data === undefined) return <RoleOverviewLoading label="vendor" />;
  if (!data) return <p className="dashboard-inline-error" role="status">Your atelier dashboard is still syncing. Refresh in a moment.</p>;

  const statusLabel = data.profile?.approvalStatus ?? "pending";
  return (
    <div className="role-overview role-overview-vendor">
      <section className="role-welcome-card vendor-welcome-card">
        <div><p className="role-overview-eyebrow">Atelier partner console</p><h2>{data.profile?.brandName || "Your atelier"} at a glance.</h2><p>Track your catalog, fulfillment handoffs, and the pieces that are carrying your partnership forward.</p></div>
        <div className="vendor-approval-card"><span className={`vendor-approval-dot vendor-approval-${statusLabel}`} aria-hidden="true" /><small>Partnership status</small><strong>{statusLabel}</strong><Link href="/dashboard/vendor/settings">Manage profile <span aria-hidden="true">↗</span></Link></div>
      </section>

      <section className="role-stat-grid" aria-label="Vendor performance summary">
        <RoleStatCard label="Gross sales" value={formatPrice(data.stats.grossSalesCents)} detail="Your catalog only" icon="◌" />
        <RoleStatCard label="Open orders" value={String(data.stats.openOrders)} detail="Awaiting fulfillment" icon="▤" />
        <RoleStatCard label="Catalog pieces" value={String(data.stats.catalogPieces)} detail={`${data.stats.unitsSold} units sold`} icon="◇" />
        <RoleStatCard label="Inventory" value={String(data.stats.inventoryUnits)} detail={`${data.stats.lowStock} low-stock pieces`} icon="▥" />
      </section>

      <div className="role-overview-grid role-overview-grid-vendor-main">
        <RolePanel eyebrow="Product performance" title="Your leading pieces" action={<DashboardLink href="/dashboard/vendor/products">Manage catalog</DashboardLink>} className="role-panel-featured">
          {data.topPieces.length ? <div className="vendor-piece-grid">{data.topPieces.map((piece) => <Link className="vendor-piece-card" href={`/products/${piece.slug}`} key={piece.id}><span className="vendor-piece-image"><Image src={piece.imageUrl} alt={piece.name} fill sizes="180px" /></span><span><strong>{piece.name}</strong><small>{piece.unitsSold} sold · {piece.stock} available</small><b>{formatPrice(piece.priceCents)}</b></span></Link>)}</div> : <div className="role-empty-state"><span aria-hidden="true">◇</span><h3>Your catalog is ready to take shape.</h3><p>Claim an unassigned piece from Products to begin building your atelier view.</p><Link className="role-primary-link" href="/dashboard/vendor/products">Review catalog <span aria-hidden="true">↗</span></Link></div>}
        </RolePanel>

        <RolePanel eyebrow="Fulfillment" title="Open handoffs" action={<DashboardLink href="/dashboard/vendor/orders">View orders</DashboardLink>}>
          {data.queue.length ? <div className="role-list vendor-queue-list">{data.queue.map((order) => <Link className="role-list-row" href="/dashboard/vendor/orders" key={order.id}><span><strong>#{order.orderNumber}</strong><small>{order.customer} · {order.itemName}</small></span><span><RoleStatus status={order.status} /><b>{formatPrice(order.amountCents)}</b></span></Link>)}</div> : <div className="role-empty-state role-empty-state-compact"><span aria-hidden="true">✓</span><h3>No open handoffs.</h3><p>Orders containing your pieces will appear here.</p></div>}
        </RolePanel>
      </div>

      <div className="role-overview-grid role-overview-grid-vendor-lower">
        <RolePanel eyebrow="Replenishment" title="Inventory alerts" action={<DashboardLink href="/dashboard/vendor/inventory">Review stock</DashboardLink>}>
          {data.lowStock.length ? <div className="vendor-stock-list">{data.lowStock.map((item) => <Link className="vendor-stock-row" href="/dashboard/vendor/inventory" key={item.id}><span><strong>{item.name}</strong><small>{item.category}</small></span><b>{item.stock} left</b></Link>)}</div> : <p className="role-empty-copy">Your managed inventory is comfortably stocked.</p>}
        </RolePanel>
        <RolePanel eyebrow="Partner signal" title="Next best move">
          <div className="vendor-next-move"><span className="vendor-next-move-mark" aria-hidden="true">✦</span><div><h3>{data.stats.lowStock ? "Refresh your low-stock pieces." : "Keep your catalog story visible."}</h3><p>{data.stats.lowStock ? "A quick stock update keeps availability accurate for customers and the SterlingMart team." : "Use Marketing to propose the next campaign around the pieces performing best."}</p><Link className="role-text-link" href={data.stats.lowStock ? "/dashboard/vendor/inventory" : "/dashboard/vendor/marketing"}>{data.stats.lowStock ? "Open inventory" : "Open marketing"} <span aria-hidden="true">↗</span></Link></div></div>
        </RolePanel>
      </div>

      <RolePanel eyebrow="Your partnership" title="Keep the atelier current" action={<DashboardLink href="/dashboard/vendor/analytics">Open analytics</DashboardLink>}>
        <div className="vendor-footer-links"><p>Performance reports are scoped to your assigned catalog and order lines. Update your profile when your studio details change.</p><div><Link className="role-text-link" href="/dashboard/vendor/settings">Update profile <span aria-hidden="true">↗</span></Link><Link className="role-text-link" href="/dashboard/vendor/collections">Review collections <span aria-hidden="true">↗</span></Link></div></div>
      </RolePanel>
    </div>
  );
}
