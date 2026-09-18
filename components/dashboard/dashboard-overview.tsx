"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice } from "@/lib/format";
import type { Role } from "@/lib/types";
import {
  type DashboardRange,
  InventoryAlertsPanel,
  type OrderStatus,
  CustomerActivityPanel,
  RecentOrdersPanel,
  SalesOverTimePanel,
  TopPiecesPanel,
  StaffTasksPanel,
  type StaffTask,
} from "@/components/dashboard/dashboard-panels";
import { DashboardOverviewLoading } from "@/components/dashboard/workspace/workspace-states";
import { FeaturedPieceModal } from "@/components/dashboard/featured-piece-modal";

type Kpi = { label: string; value: string; detail: string; tone: "positive" | "negative"; icon: string; spark: string };

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <article className="dashboard-kpi-card">
      <span className="dashboard-kpi-icon" aria-hidden="true">{kpi.icon}</span>
      <div className="dashboard-kpi-copy"><span>{kpi.label}</span><strong>{kpi.value}</strong><small className={`dashboard-kpi-delta is-${kpi.tone}`}>{kpi.detail}</small></div>
      <span className={`dashboard-kpi-spark dashboard-kpi-spark-${kpi.spark}`} aria-hidden="true" />
    </article>
  );
}

export function DashboardOverview({ role }: { role: Role }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [range, setRange] = useState<DashboardRange>("30D");
  useEffect(() => {
    const handlePeriodChange = (event: Event) => {
      const next = (event as CustomEvent<DashboardRange>).detail;
      if (["7D", "30D", "3M", "6M", "1Y"].includes(next)) setRange(next);
    };
    window.addEventListener("sterling-period-change", handlePeriodChange);
    return () => window.removeEventListener("sterling-period-change", handlePeriodChange);
  }, []);
  const canQueryProtectedData = authLoaded && isSignedIn;
  const data = useQuery(api.dashboard.overview, canQueryProtectedData ? { range } : "skip");
  const staffTasks = useQuery(api.staff.tasks, canQueryProtectedData && role === "staff" ? {} : "skip");
  const updateStatus = useMutation(api.orders.updateStatus);
  const updateStock = useMutation(api.dashboard.updateStock);
  const toggleFeatured = useMutation(api.dashboard.toggleFeatured);
  const updateTask = useMutation(api.staff.updateTask);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [busyProduct, setBusyProduct] = useState<string | null>(null);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyTask, setBusyTask] = useState<string | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const closePiecePreview = useCallback(() => setSelectedPieceId(null), []);
  const selectedPieceDetails = useQuery(
    api.dashboard.productDetails,
    canQueryProtectedData && selectedPieceId ? { productId: selectedPieceId as Id<"products"> } : "skip",
  );
  if (!authLoaded || data === undefined || (role === "staff" && staffTasks === undefined)) return <DashboardOverviewLoading />;
  if (data === null) return <p className="dashboard-inline-error dashboard-global-error" role="status">Your dashboard profile is still syncing. Refresh in a moment.</p>;
  const canUpdateOrders = role === "admin" || role === "staff";
  const canManageCatalog = role === "admin" || role === "vendor" || role === "staff";
  const workspaceBase = `/dashboard/${role}`;
  const kpis: Kpi[] = [
    { label: role === "customer" ? "My spend" : "Net sales", value: formatPrice(data.stats.revenueCents), detail: role === "customer" ? "Across live orders" : "Live store totals", tone: "positive", icon: "▱", spark: "up" },
    { label: role === "staff" ? "Orders in queue" : role === "customer" ? "My orders" : "Orders", value: String(data.stats.orders), detail: role === "staff" ? "Current fulfillment queue" : "Live order records", tone: "positive", icon: "♧", spark: "up" },
    { label: "Average order value", value: formatPrice(data.stats.averageOrderValueCents), detail: data.stats.orders ? "Across active orders" : "No active orders", tone: "positive", icon: "▥", spark: "up" },
    { label: role === "customer" ? "Saved pieces" : "Low stock", value: String(role === "customer" ? data.stats.savedPieces : data.stats.lowStock), detail: role === "customer" ? "Saved in your account" : "At or below threshold", tone: role === "customer" ? "positive" : "negative", icon: role === "customer" ? "♡" : "◇", spark: role === "customer" ? "up" : "down" },
  ];
  const revenueCents = data.stats.revenueCents;

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setBusyOrder(orderId);
    setError(null);
    try {
      await updateStatus({ orderId: orderId as Id<"orders">, status });
    } catch {
      setError("That order update could not be saved.");
    } finally {
      setBusyOrder(null);
    }
  }

  async function handleStockSave(productId: string, currentStock: number) {
    const stock = Number(stockDrafts[productId] ?? currentStock);
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock must be a non-negative whole number.");
      return;
    }
    setBusyProduct(`stock:${productId}`);
    setError(null);
    try {
      await updateStock({ productId: productId as Id<"products">, stock });
      setStockDrafts((current) => ({ ...current, [productId]: String(stock) }));
    } catch {
      setError("That inventory update could not be saved.");
    } finally {
      setBusyProduct(null);
    }
  }

  async function handleFeaturedToggle(productId: string) {
    setBusyProduct(`featured:${productId}`);
    setError(null);
    try {
      await toggleFeatured({ productId: productId as Id<"products"> });
    } catch {
      setError("That catalog change could not be saved.");
    } finally {
      setBusyProduct(null);
    }
  }

  async function handleTaskStatusChange(taskId: string, status: "open" | "in_progress" | "done") {
    setBusyTask(taskId);
    setError(null);
    try { await updateTask({ taskId: taskId as Id<"staffTasks">, status }); } catch { setError("That task update could not be saved."); } finally { setBusyTask(null); }
  }

  return (
    <div className="dashboard-overview" id="dashboard-overview">
      <section className="dashboard-kpi-grid" aria-label={`${role} dashboard summary`}>{kpis.map((kpi) => <KpiCard kpi={kpi} key={kpi.label} />)}</section>
      {error && <p className="dashboard-inline-error dashboard-global-error" role="alert">{error}</p>}
      <div className="dashboard-primary-grid">
        <SalesOverTimePanel range={range} trend={data?.trend ?? []} revenueCents={revenueCents} onRangeChange={setRange} />
        <TopPiecesPanel pieces={data?.topPieces ?? []} canManageCatalog={canManageCatalog} busyProduct={busyProduct} onToggleFeatured={(productId) => void handleFeaturedToggle(productId)} onOpenPiece={(piece) => setSelectedPieceId(piece.id)} viewHref={`${workspaceBase}/products`} />
      </div>
      <div className="dashboard-secondary-grid">
        <RecentOrdersPanel orders={data?.recentOrders ?? []} canUpdateOrders={canUpdateOrders} busyOrder={busyOrder} onStatusChange={(orderId, status) => void handleStatusChange(orderId, status)} viewHref={`${workspaceBase}/orders`} />
        <InventoryAlertsPanel items={data?.lowStockItems ?? []} canManageCatalog={canManageCatalog} stockDrafts={stockDrafts} busyProduct={busyProduct} onStockDraftChange={(productId, stock) => setStockDrafts((current) => ({ ...current, [productId]: stock }))} onStockSave={(productId, stock) => void handleStockSave(productId, stock)} viewHref={`${workspaceBase}/inventory`} />
        <CustomerActivityPanel activity={data?.customerActivity ?? []} viewHref={`${workspaceBase}/${role === "admin" || role === "staff" ? "customers" : "orders"}`} />
        {role === "staff" && <StaffTasksPanel tasks={(staffTasks ?? []) as StaffTask[]} busyTask={busyTask} onStatusChange={(taskId, status) => void handleTaskStatusChange(taskId, status)} />}
      </div>
      {selectedPieceId && data.topPieces.some((piece) => piece.id === selectedPieceId) && (
        <FeaturedPieceModal
          piece={data.topPieces.find((piece) => piece.id === selectedPieceId)!}
          details={selectedPieceDetails}
          canManageCatalog={canManageCatalog}
          busy={busyProduct === `featured:${selectedPieceId}`}
          onToggleFeatured={() => void handleFeaturedToggle(selectedPieceId)}
          onClose={closePiecePreview}
        />
      )}
    </div>
  );
}
