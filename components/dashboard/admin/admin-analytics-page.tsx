"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDate, formatPrice } from "@/lib/format";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import { SalesOverTimePanel, type DashboardRange } from "@/components/dashboard/dashboard-panels";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

export function AdminAnalyticsPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const canQueryProtectedData = authLoaded && isSignedIn;
  const [range, setRange] = useState<DashboardRange>("30D");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overview = useQuery(api.dashboard.overview, canQueryProtectedData ? { range } : "skip");
  const summary = useQuery(api.analytics.summary, canQueryProtectedData ? {} : "skip");
  const snapshots = useQuery(api.analytics.snapshots, canQueryProtectedData ? {} : "skip");
  const capture = useMutation(api.analytics.capture);

  if (!canQueryProtectedData || overview === undefined || summary === undefined || snapshots === undefined) return <WorkspaceLoadingState label="analytics" />;

  async function captureSnapshot() {
    setBusy(true);
    setError(null);
    try { await capture({ period: range }); } catch { setError("The analytics snapshot could not be saved."); } finally { setBusy(false); }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-analytics-heading">
      <AdminPageHeader eyebrow="Performance intelligence" title="Analytics" description="Read live commerce signals and preserve point-in-time snapshots for operating decisions." action={<button className="admin-button" type="button" disabled={busy} onClick={() => void captureSnapshot()}>{busy ? "Capturing…" : "Capture snapshot"} <span aria-hidden="true">＋</span></button>} />
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-summary-grid"><article className="admin-summary-card"><span>Net sales</span><strong>{formatPrice(summary?.revenueCents ?? 0)}</strong><small>Live store signal</small></article><article className="admin-summary-card"><span>Orders</span><strong>{summary?.orderCount ?? 0}</strong><small>All non-cancelled orders</small></article><article className="admin-summary-card"><span>Average order value</span><strong>{formatPrice(summary?.averageOrderValueCents ?? 0)}</strong><small>Across active orders</small></article><article className="admin-summary-card"><span>Inventory attention</span><strong>{summary?.lowStock ?? 0}</strong><small>Pieces at or below threshold</small></article></div>
      <div className="admin-analytics-chart"><SalesOverTimePanel range={range} trend={overview?.trend ?? []} revenueCents={summary?.revenueCents ?? 0} onRangeChange={setRange} /></div>
      <div className="admin-analytics-grid"><article className="admin-table-card admin-analytics-list"><div className="admin-card-heading"><div><p className="admin-card-kicker">Merchandising</p><h3>Top pieces by movement</h3></div></div>{summary?.topProducts?.length ? <ol>{summary.topProducts.map((piece) => <li key={piece.id}><span>{piece.name}</span><strong>{piece.unitsSold} sold</strong></li>)}</ol> : <p className="admin-empty">Top pieces will appear when order data is available.</p>}</article><article className="admin-table-card admin-analytics-list"><div className="admin-card-heading"><div><p className="admin-card-kicker">Saved reports</p><h3>Snapshot history</h3></div></div>{snapshots?.length ? <ul>{snapshots.map((snapshot) => <li key={snapshot._id}><span>{snapshot.period} · {formatDate(snapshot.capturedAt)}</span><strong>{formatPrice(snapshot.revenueCents)} · {snapshot.orderCount} orders</strong></li>)}</ul> : <p className="admin-empty">Capture a snapshot to start a report history.</p>}</article></div>
    </section>
  );
}
