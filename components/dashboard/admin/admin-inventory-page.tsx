"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice } from "@/lib/format";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

export function AdminInventoryPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const canQueryProtectedData = authLoaded && isSignedIn;
  const [search, setSearch] = useState("");
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyProduct, setBusyProduct] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const products = useQuery(api.admin.products, canQueryProtectedData ? { activeOnly: true } : "skip");
  const updateProduct = useMutation(api.admin.updateProduct);
  const visibleProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (products ?? []).filter((product) => (!alertsOnly || (product.stock ?? 0) <= 12) && (!needle || `${product.name} ${product.category} ${product.sku ?? ""}`.toLowerCase().includes(needle))).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
  }, [alertsOnly, products, search]);

  if (!canQueryProtectedData || products === undefined) return <WorkspaceLoadingState label="inventory" />;

  async function saveStock(productId: string, currentStock: number) {
    const stock = Number(drafts[productId] ?? currentStock);
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock must be a non-negative whole number.");
      return;
    }
    setBusyProduct(productId);
    setError(null);
    try {
      await updateProduct({ productId: productId as Id<"products">, stock });
    } catch {
      setError("The inventory update could not be saved.");
    } finally {
      setBusyProduct(null);
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-inventory-heading">
      <AdminPageHeader eyebrow="Stock control" title="Inventory" description="Keep every piece accounted for, with a clear path from low-stock alert to replenished shelf." />
      <div className="admin-toolbar"><label className="admin-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search inventory</span><input type="search" placeholder="Search product, category, or SKU" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="admin-check-filter"><input checked={alertsOnly} onChange={(event) => setAlertsOnly(event.target.checked)} type="checkbox" /> Low stock only</label><span className="admin-toolbar-count">{visibleProducts.length} piece{visibleProducts.length === 1 ? "" : "s"}</span></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-table-card"><table className="admin-table"><thead><tr><th scope="col">Product</th><th scope="col">SKU</th><th scope="col">Category</th><th scope="col">Price</th><th scope="col">On hand</th><th scope="col">Availability</th></tr></thead><tbody>{visibleProducts.length ? visibleProducts.map((product) => <tr key={product._id}><td><strong>{product.name}</strong><small>{product.vendorName ?? "SterlingMart Atelier"}</small></td><td>{product.sku ?? "—"}</td><td>{product.category}</td><td>{formatPrice(product.priceCents)}</td><td><form className="admin-inline-form" onSubmit={(event) => { event.preventDefault(); void saveStock(product._id, product.stock ?? 0); }}><label className="sr-only" htmlFor={`inventory-${product._id}`}>Stock for {product.name}</label><input id={`inventory-${product._id}`} min="0" type="number" value={drafts[product._id] ?? product.stock ?? 0} onChange={(event) => setDrafts((current) => ({ ...current, [product._id]: event.target.value }))} /><button type="submit" disabled={busyProduct === product._id}>{busyProduct === product._id ? "…" : "Save"}</button></form></td><td><span className={`admin-stock-status${(product.stock ?? 0) <= 7 ? " is-critical" : (product.stock ?? 0) <= 12 ? " is-low" : ""}`}>{(product.stock ?? 0) <= 7 ? "Critical" : (product.stock ?? 0) <= 12 ? "Low stock" : "Healthy"}</span></td></tr>) : <tr><td colSpan={6}><span className="admin-empty">No inventory matches this view.</span></td></tr>}</tbody></table></div>
    </section>
  );
}
