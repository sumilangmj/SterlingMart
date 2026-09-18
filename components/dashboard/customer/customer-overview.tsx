"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDate, formatPrice } from "@/lib/format";
import { DashboardLink, RoleOverviewLoading, RolePanel, RoleStatCard, RoleStatus } from "@/components/dashboard/role-overview-ui";

export function CustomerDashboardOverview() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const data = useQuery(api.customer.overview, authLoaded && isSignedIn ? {} : "skip");
  if (!authLoaded || data === undefined) return <RoleOverviewLoading label="your" />;
  if (!data) return <p className="dashboard-inline-error" role="status">Your personal dashboard is still syncing. Refresh in a moment.</p>;

  const firstName = data.displayName.split(" ")[0] || "there";
  const trendMax = Math.max(...data.spendTrend.map((point) => point.valueCents), 1);
  return (
    <div className="role-overview role-overview-customer">
      <section className="role-welcome-card">
        <div>
          <p className="role-overview-eyebrow">Your private edit</p>
          <h2>Welcome to your jewelry room, {firstName}.</h2>
          <p>Keep the pieces you love close, follow every order, and discover the next heirloom at your own pace.</p>
        </div>
        <div className="role-welcome-actions">
          <span className="role-welcome-mark" aria-hidden="true">SM</span>
          <Link className="role-primary-link" href="/collections">Explore collections <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className="role-stat-grid" aria-label="Your account summary">
        <RoleStatCard label="My spend" value={formatPrice(data.stats.spendCents)} detail="Across active orders" icon="◌" />
        <RoleStatCard label="My orders" value={String(data.stats.orders)} detail={`${data.stats.pendingOrders} currently pending`} icon="▤" />
        <RoleStatCard label="Average order" value={formatPrice(data.stats.averageOrderValueCents)} detail="Per active order" icon="◇" />
        <RoleStatCard label="Saved pieces" value={String(data.stats.savedPieces)} detail={data.stats.cartItems ? `${data.stats.cartItems} in your cart` : "Start curating"} icon="♡" />
      </section>

      <div className="role-overview-grid role-overview-grid-customer-main">
        <RolePanel eyebrow="Your journey" title="Latest order" action={<DashboardLink href="/dashboard/customer/orders">All orders</DashboardLink>} className="role-panel-featured">
          {data.latestOrder ? (
            <div className="customer-latest-order">
              <div className="customer-order-story">
                <p className="role-panel-eyebrow">Order #{data.latestOrder.orderNumber}</p>
                <h3>{data.latestOrder.itemName}</h3>
                <p>{data.latestOrder.itemCount} item{data.latestOrder.itemCount === 1 ? "" : "s"} · placed {formatDate(data.latestOrder.createdAt)}</p>
                <RoleStatus status={data.latestOrder.status} />
              </div>
              <div className="customer-order-total"><span>Total</span><strong>{formatPrice(data.latestOrder.amountCents)}</strong></div>
            </div>
          ) : (
            <div className="role-empty-state"><span aria-hidden="true">✦</span><h3>Your next story starts here.</h3><p>Browse the collection when you’re ready to find a piece worth keeping.</p><Link className="role-primary-link" href="/collections">Browse the edit <span aria-hidden="true">↗</span></Link></div>
          )}
        </RolePanel>

        <RolePanel eyebrow="Personal signal" title="Your spending rhythm" className="role-panel-trend">
          <div className="customer-trend" aria-label="Spending over the recent six periods">
            <div className="customer-trend-bars">{data.spendTrend.map((point) => <div className="customer-trend-column" key={point.label}><span style={{ height: `${Math.max((point.valueCents / trendMax) * 100, point.valueCents ? 12 : 4)}%` }} title={`${point.label}: ${formatPrice(point.valueCents)}`} /><small>{point.label}</small></div>)}</div>
            <p><strong>{formatPrice(data.stats.spendCents)}</strong><span>total active spend</span></p>
          </div>
        </RolePanel>
      </div>

      <div className="role-overview-grid role-overview-grid-customer-lower">
        <RolePanel eyebrow="Recent movement" title="Order history" action={<DashboardLink href="/dashboard/customer/orders">View history</DashboardLink>}>
          {data.recentOrders.length ? <div className="role-list customer-order-list">{data.recentOrders.map((order) => <Link className="role-list-row" href="/dashboard/customer/orders" key={order.id}><span><strong>#{order.orderNumber}</strong><small>{order.itemName} · {formatDate(order.createdAt, { month: "short", day: "numeric" })}</small></span><span><RoleStatus status={order.status} /><b>{formatPrice(order.amountCents)}</b></span></Link>)}</div> : <p className="role-empty-copy">Your orders will appear here after checkout.</p>}
        </RolePanel>

        <RolePanel eyebrow="Your edit" title="Saved pieces" action={<DashboardLink href="/dashboard/customer/saved-pieces">Manage saved</DashboardLink>}>
          {data.savedPieces.length ? <div className="customer-piece-strip">{data.savedPieces.slice(0, 3).map((piece) => <Link href={`/products/${piece.slug}`} key={piece.id}><span className="customer-piece-image"><Image src={piece.imageUrl} alt={piece.name} fill sizes="120px" /></span><strong>{piece.name}</strong><small>{formatPrice(piece.priceCents)}</small></Link>)}</div> : <div className="role-empty-state role-empty-state-compact"><span aria-hidden="true">♡</span><h3>A shortlist with intention.</h3><p>Save a piece from Products to make it part of your private edit.</p><Link className="role-text-link" href="/dashboard/customer/products">Find a piece <span aria-hidden="true">↗</span></Link></div>}
        </RolePanel>
      </div>

      <RolePanel eyebrow="Curated for you" title="Pieces to consider" action={<DashboardLink href="/dashboard/customer/products">View products</DashboardLink>}>
        <div className="customer-recommendation-grid">{data.curatedPieces.map((piece) => <Link className="customer-recommendation" href={`/products/${piece.slug}`} key={piece.id}><span className="customer-recommendation-image"><Image src={piece.imageUrl} alt={piece.name} fill sizes="220px" /></span><span><small>{piece.category}</small><strong>{piece.name}</strong><b>{formatPrice(piece.priceCents)}</b></span></Link>)}</div>
      </RolePanel>
    </div>
  );
}
