"use client";

import Image from "next/image";
import { type FormEvent, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  category: string;
  collection: string;
  sku: string;
  material: string;
  gemstone: string;
  price: string;
  imageUrl: string;
  accent: string;
  stock: string;
  vendorName: string;
  featured: boolean;
};

const emptyProduct: ProductForm = {
  name: "",
  slug: "",
  description: "",
  category: "Rings",
  collection: "Signature Edit",
  sku: "",
  material: "18k gold",
  gemstone: "",
  price: "",
  imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85",
  accent: "gold",
  stock: "0",
  vendorName: "SterlingMart Atelier",
  featured: false,
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function dollarsToCents(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : NaN;
}

export function AdminProductsPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const canQueryProtectedData = authLoaded && isSignedIn;
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [drafts, setDrafts] = useState<Record<string, { price: string; stock: string }>>({});
  const [busyProduct, setBusyProduct] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const products = useQuery(api.admin.products, canQueryProtectedData ? { search: search || undefined } : "skip");
  const createProduct = useMutation(api.admin.createProduct);
  const updateProduct = useMutation(api.admin.updateProduct);
  const archiveProduct = useMutation(api.admin.archiveProduct);

  const activeCount = products?.filter((product) => product.isActive).length ?? 0;

  const visibleProducts = useMemo(() => products ?? [], [products]);

  if (!canQueryProtectedData || products === undefined) return <WorkspaceLoadingState label="products" />;

  function updateForm(field: keyof ProductForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceCents = dollarsToCents(form.price);
    const stock = Number(form.stock);
    if (!form.name.trim() || !form.description.trim() || !form.sku.trim()) {
      setError("Name, description, and SKU are required.");
      return;
    }
    if (!Number.isInteger(priceCents) || priceCents < 0 || !Number.isInteger(stock) || stock < 0) {
      setError("Price and stock must be valid non-negative numbers.");
      return;
    }
    setBusyProduct("create");
    setError(null);
    try {
      await createProduct({
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        description: form.description.trim(),
        category: form.category.trim(),
        collection: form.collection.trim(),
        sku: form.sku.trim(),
        material: form.material.trim(),
        gemstone: form.gemstone.trim(),
        priceCents,
        imageUrl: form.imageUrl.trim(),
        accent: form.accent.trim() || "gold",
        stock,
        featured: form.featured,
        vendorName: form.vendorName.trim() || "SterlingMart Atelier",
      });
      setForm(emptyProduct);
      setShowCreate(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "The product could not be created.");
    } finally {
      setBusyProduct(null);
    }
  }

  function draftFor(productId: string, priceCents: number, stock: number) {
    return drafts[productId] ?? { price: String(priceCents / 100), stock: String(stock) };
  }

  async function saveProduct(productId: string, priceCents: number, stock: number) {
    const draft = draftFor(productId, priceCents, stock);
    const nextPriceCents = dollarsToCents(draft.price);
    const nextStock = Number(draft.stock);
    if (!Number.isInteger(nextPriceCents) || nextPriceCents < 0 || !Number.isInteger(nextStock) || nextStock < 0) {
      setError("Price and stock must be valid non-negative numbers.");
      return;
    }
    setBusyProduct(productId);
    setError(null);
    try {
      await updateProduct({ productId: productId as Id<"products">, priceCents: nextPriceCents, stock: nextStock });
    } catch {
      setError("The product update could not be saved.");
    } finally {
      setBusyProduct(null);
    }
  }

  async function toggleFeatured(productId: string, featured: boolean) {
    setBusyProduct(`featured:${productId}`);
    setError(null);
    try {
      await updateProduct({ productId: productId as Id<"products">, featured: !featured });
    } catch {
      setError("The signature edit could not be updated.");
    } finally {
      setBusyProduct(null);
    }
  }

  async function toggleActive(productId: string, isActive: boolean) {
    setBusyProduct(`active:${productId}`);
    setError(null);
    try {
      await archiveProduct({ productId: productId as Id<"products"> });
    } catch {
      setError(`The product could not be ${isActive ? "archived" : "restored"}.`);
    } finally {
      setBusyProduct(null);
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-products-heading">
      <AdminPageHeader eyebrow="Catalog control" title="Products" description="Create, curate, and maintain every piece in the SterlingMart catalog." action={<button className="admin-button" type="button" onClick={() => setShowCreate((current) => !current)}>{showCreate ? "Close form" : "Add product"} <span aria-hidden="true">{showCreate ? "×" : "＋"}</span></button>} />
      <div className="admin-toolbar"><label className="admin-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search products</span><input type="search" placeholder="Search names, collections, categories, or SKUs" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="admin-toolbar-count">{activeCount} live · {products?.length ?? 0} total</span></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {showCreate && <form className="admin-form-card" onSubmit={(event) => void handleCreate(event)}><div className="admin-form-heading"><div><p className="admin-card-kicker">New catalog entry</p><h3>Make a piece available</h3></div><span>All fields save to Convex</span></div><div className="admin-form-grid"><label className="admin-form-field"><span>Name *</span><input required value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Lumière Oval Ring" /></label><label className="admin-form-field"><span>Slug</span><input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} placeholder="lumiere-oval-ring" /></label><label className="admin-form-field admin-form-field-wide"><span>Description *</span><textarea required rows={3} value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="A considered description for the product page." /></label><label className="admin-form-field"><span>Category</span><input value={form.category} onChange={(event) => updateForm("category", event.target.value)} /></label><label className="admin-form-field"><span>Collection</span><input value={form.collection} onChange={(event) => updateForm("collection", event.target.value)} /></label><label className="admin-form-field"><span>SKU *</span><input required value={form.sku} onChange={(event) => updateForm("sku", event.target.value)} placeholder="SM-RING-013" /></label><label className="admin-form-field"><span>Price (USD) *</span><input required min="0" step="0.01" type="number" value={form.price} onChange={(event) => updateForm("price", event.target.value)} /></label><label className="admin-form-field"><span>Stock *</span><input required min="0" step="1" type="number" value={form.stock} onChange={(event) => updateForm("stock", event.target.value)} /></label><label className="admin-form-field"><span>Material</span><input value={form.material} onChange={(event) => updateForm("material", event.target.value)} /></label><label className="admin-form-field"><span>Gemstone</span><input value={form.gemstone} onChange={(event) => updateForm("gemstone", event.target.value)} placeholder="Diamond" /></label><label className="admin-form-field admin-form-field-wide"><span>Image URL *</span><input required type="url" value={form.imageUrl} onChange={(event) => updateForm("imageUrl", event.target.value)} /></label><label className="admin-form-field"><span>Vendor</span><input value={form.vendorName} onChange={(event) => updateForm("vendorName", event.target.value)} /></label></div><div className="admin-form-actions"><label className="admin-checkbox"><input type="checkbox" checked={form.featured} onChange={(event) => updateForm("featured", event.target.checked)} /> Add to signature edit</label><button className="admin-button" disabled={busyProduct === "create"} type="submit">{busyProduct === "create" ? "Creating…" : "Create product"}</button></div></form>}
      <div className="admin-table-card"><table className="admin-table admin-product-table"><thead><tr><th scope="col">Product</th><th scope="col">SKU / Category</th><th scope="col">Price</th><th scope="col">Stock</th><th scope="col">Visibility</th><th scope="col">Actions</th></tr></thead><tbody>{visibleProducts.length ? visibleProducts.map((product) => { const draft = draftFor(product._id, product.priceCents, product.stock ?? 0); return <tr key={product._id}><td><span className="admin-product-cell"><span className="admin-product-thumb">{product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="42px" /> : "✦"}</span><span><strong>{product.name}</strong><small>{product.collection ?? "Unassigned"}</small></span></span></td><td><strong>{product.sku ?? "—"}</strong><small>{product.category}</small></td><td><label className="sr-only" htmlFor={`price-${product._id}`}>Price for {product.name}</label><input className="admin-table-input" id={`price-${product._id}`} min="0" step="0.01" type="number" value={draft.price} onChange={(event) => setDrafts((current) => ({ ...current, [product._id]: { ...draft, price: event.target.value } }))} /></td><td><label className="sr-only" htmlFor={`stock-${product._id}`}>Stock for {product.name}</label><input className="admin-table-input admin-stock-input" id={`stock-${product._id}`} min="0" step="1" type="number" value={draft.stock} onChange={(event) => setDrafts((current) => ({ ...current, [product._id]: { ...draft, stock: event.target.value } }))} /></td><td><span className={`admin-stock-status${product.isActive ? "" : " is-archived"}`}>{product.isActive ? "Live" : "Archived"}</span></td><td><div className="admin-table-actions"><button className="admin-table-action" disabled={busyProduct === product._id} type="button" onClick={() => void saveProduct(product._id, product.priceCents, product.stock ?? 0)}>{busyProduct === product._id ? "…" : "Save"}</button><button className={`admin-table-action${product.featured ? " is-gold" : ""}`} disabled={busyProduct === `featured:${product._id}`} type="button" onClick={() => void toggleFeatured(product._id, Boolean(product.featured))}>{product.featured ? "★ Featured" : "☆ Feature"}</button><button className="admin-table-action is-muted" disabled={busyProduct === `active:${product._id}`} type="button" onClick={() => void toggleActive(product._id, product.isActive)}>{product.isActive ? "Archive" : "Restore"}</button></div></td></tr>; }) : <tr><td colSpan={6}><span className="admin-empty">No products match this view.</span></td></tr>}</tbody></table></div>
      <p className="admin-table-footnote">Prices are entered in dollars and validated server-side in Convex. Current product values shown here are authoritative.</p>
    </section>
  );
}
