"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDate, formatPrice } from "@/lib/format";
import { ProductCard } from "@/components/storefront/product-card";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import type { CustomerSection } from "@/components/dashboard/role-section-page";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

type AddressForm = { label: string; recipient: string; line1: string; city: string; postalCode: string; country: string; isDefault: boolean };
const blankAddress: AddressForm = { label: "Home", recipient: "", line1: "", city: "", postalCode: "", country: "Philippines", isDefault: true };

export function CustomerWorkspace({ section }: { section: CustomerSection }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const canQueryProtectedData = authLoaded && isSignedIn;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const orders = useQuery(api.customer.orders, canQueryProtectedData && section === "orders" ? { status: (status || undefined) as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | undefined } : "skip");
  const products = useQuery(api.customer.products, canQueryProtectedData && section === "products" ? { search: search || undefined } : "skip");
  const collections = useQuery(api.customer.collections, canQueryProtectedData && section === "collections" ? {} : "skip");
  const savedPieces = useQuery(api.customer.savedPieces, canQueryProtectedData && section === "saved-pieces" ? {} : "skip");
  const settings = useQuery(api.customer.settings, canQueryProtectedData && section === "settings" ? {} : "skip");
  const cancelOrder = useMutation(api.customer.cancelOrder);
  const toggleFavorite = useMutation(api.favorites.toggle);
  const saveAddress = useMutation(api.customer.saveAddress);
  const removeAddress = useMutation(api.customer.removeAddress);
  const savePreferences = useMutation(api.customer.savePreferences);
  const [addressForm, setAddressForm] = useState<AddressForm>(blankAddress);
  const [showAddress, setShowAddress] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState<boolean | null>(null);
  const [smsUpdates, setSmsUpdates] = useState<boolean | null>(null);
  const [styleProfile, setStyleProfile] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const loading = (section === "orders" && orders === undefined)
    || (section === "products" && products === undefined)
    || (section === "collections" && collections === undefined)
    || (section === "saved-pieces" && savedPieces === undefined)
    || (section === "settings" && settings === undefined);
  const filteredSavedPieces = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (savedPieces ?? []).filter((item) => !needle || `${item.product.name} ${item.product.category} ${item.product.collection ?? ""}`.toLowerCase().includes(needle));
  }, [savedPieces, search]);
  if (!canQueryProtectedData || loading) return <WorkspaceLoadingState label={section.replace("-", " ")} />;

  async function run(action: () => Promise<unknown>, key: string) {
    setBusy(key);
    setError(null);
    try { await action(); } catch { setError("That update could not be saved. Please try again."); } finally { setBusy(null); }
  }

  async function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(() => saveAddress(addressForm), "address");
    setAddressForm(blankAddress);
    setShowAddress(false);
  }

  async function submitPreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(() => savePreferences({ emailUpdates: emailUpdates ?? settings?.preferences.emailUpdates ?? true, smsUpdates: smsUpdates ?? settings?.preferences.smsUpdates ?? false, styleProfile: styleProfile || settings?.preferences.styleProfile || "Quiet brilliance" }), "preferences");
  }

  if (section === "orders") return <section className="admin-section" aria-labelledby="customer-orders-heading"><AdminPageHeader eyebrow="Your journey" title="Orders" description="Follow every piece from pending order to its next destination." /><div className="admin-toolbar"><label className="admin-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All orders</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></label><span className="admin-toolbar-count">{orders?.length ?? 0} orders</span></div>{error && <p className="admin-error" role="alert">{error}</p>}<div className="admin-table-card"><table className="admin-table"><thead><tr><th>Order</th><th>Piece</th><th>Total</th><th>Status</th><th>Tracking</th><th>Placed</th><th>Action</th></tr></thead><tbody>{orders?.length ? orders.map((order) => <tr key={order.id}><td className="admin-order-number">#{order.orderNumber}</td><td><strong>{order.itemName}</strong><small>{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</small></td><td>{formatPrice(order.amountCents)}</td><td><span className={`admin-status admin-status-${order.status}`}>{order.status}</span></td><td>{order.trackingNumber}</td><td>{formatDate(order.createdAt)}</td><td>{order.status === "pending" ? <button className="admin-table-action is-muted" type="button" disabled={busy === order.id} onClick={() => void run(() => cancelOrder({ orderId: order.id as Id<"orders"> }), order.id)}>{busy === order.id ? "…" : "Cancel"}</button> : <span className="admin-table-muted">—</span>}</td></tr>) : <tr><td colSpan={7}><span className="admin-empty">No orders yet. Your next considered piece is waiting in the collection.</span></td></tr>}</tbody></table></div></section>;

  if (section === "products") return <section className="admin-section" aria-labelledby="customer-products-heading"><AdminPageHeader eyebrow="Explore the edit" title="Products" description="Browse the live collection, save pieces for later, and open any product for the full story." /><label className="admin-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search products</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection" /></label>{products?.length ? <div className="customer-product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div> : <div className="admin-empty-card">No pieces match this search.</div>}</section>;

  if (section === "collections") return <section className="admin-section" aria-labelledby="customer-collections-heading"><AdminPageHeader eyebrow="Browse by story" title="Collections" description="Find a point of view that feels like yours, then move from the collection into each piece." /><div className="customer-collection-grid">{collections?.length ? collections.map((collection) => <article className="customer-collection-card" key={collection._id}><div className="customer-collection-copy"><p className="admin-card-kicker">{collection.pieces.length} pieces</p><h3>{collection.name}</h3><p>{collection.description}</p><Link className="admin-text-link" href={`/?collection=${collection.slug}#collection`}>Shop collection <span aria-hidden="true">↗</span></Link></div><div className="customer-collection-pieces">{collection.pieces.slice(0, 3).map((piece) => <Link href={`/products/${piece.slug}`} key={piece.id}><Image src={piece.imageUrl} alt={piece.name} fill sizes="120px" /></Link>)}</div></article>) : <div className="admin-empty-card">Collections are being prepared.</div>}</div></section>;

  if (section === "saved-pieces") return <section className="admin-section" aria-labelledby="customer-saved-heading"><AdminPageHeader eyebrow="Your edit" title="Saved pieces" description="A private shortlist for the pieces that keep calling you back." /><label className="admin-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search saved pieces</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your saved pieces" /></label>{filteredSavedPieces.length ? <div className="customer-saved-grid">{filteredSavedPieces.map((item) => <article className="customer-saved-card" key={item.favoriteId}><Link className="customer-saved-image" href={`/products/${item.product.slug}`}><Image src={item.product.imageUrl} alt={item.product.name} fill sizes="(max-width: 760px) 50vw, 240px" /></Link><div><p className="admin-card-kicker">{item.product.collection ?? item.product.category}</p><h3>{item.product.name}</h3><span>{formatPrice(item.product.priceCents)}</span><button className="admin-table-action is-muted" type="button" disabled={busy === item.product._id} onClick={() => void run(() => toggleFavorite({ productId: item.product._id }), item.product._id)}>{busy === item.product._id ? "…" : "Remove"}</button></div></article>)}</div> : <div className="admin-empty-card">No saved pieces yet. Select the heart on any product to start your private edit.</div>}</section>;

  return <section className="admin-section" aria-labelledby="customer-settings-heading"><AdminPageHeader eyebrow="Your account" title="Settings" description="Keep your delivery details, style profile, and communication preferences ready for the next order." />{error && <p className="admin-error" role="alert">{error}</p>}<div className="customer-settings-grid"><article className="admin-settings-card"><p className="admin-card-kicker">Profile</p><h3>{settings?.profile.displayName ?? "Your account"}</h3><p className="customer-settings-email">{settings?.profile.email ?? "Loading your account…"}</p><form className="customer-preferences-form" onSubmit={(event) => void submitPreferences(event)}><label className="admin-form-field"><span>Style profile</span><select value={styleProfile || settings?.preferences.styleProfile || "Quiet brilliance"} onChange={(event) => setStyleProfile(event.target.value)}><option>Quiet brilliance</option><option>Everyday icons</option><option>After dark</option><option>The pearl room</option></select></label><label className="admin-checkbox"><input type="checkbox" checked={emailUpdates ?? settings?.preferences.emailUpdates ?? true} onChange={(event) => setEmailUpdates(event.target.checked)} /> Email collection updates</label><label className="admin-checkbox"><input type="checkbox" checked={smsUpdates ?? settings?.preferences.smsUpdates ?? false} onChange={(event) => setSmsUpdates(event.target.checked)} /> SMS delivery updates</label><button className="admin-button" disabled={busy === "preferences"} type="submit">{busy === "preferences" ? "Saving…" : "Save preferences"}</button></form></article><article className="admin-settings-card"><div className="admin-card-heading"><div><p className="admin-card-kicker">Delivery</p><h3>Saved addresses</h3></div><button className="admin-table-action" type="button" onClick={() => setShowAddress((current) => !current)}>{showAddress ? "Close" : "Add address"}</button></div>{showAddress && <form className="customer-address-form" onSubmit={(event) => void submitAddress(event)}><div className="admin-form-grid"><label className="admin-form-field"><span>Label</span><input value={addressForm.label} onChange={(event) => setAddressForm((current) => ({ ...current, label: event.target.value }))} /></label><label className="admin-form-field"><span>Recipient</span><input required value={addressForm.recipient} onChange={(event) => setAddressForm((current) => ({ ...current, recipient: event.target.value }))} /></label><label className="admin-form-field admin-form-field-wide"><span>Address</span><input required value={addressForm.line1} onChange={(event) => setAddressForm((current) => ({ ...current, line1: event.target.value }))} /></label><label className="admin-form-field"><span>City</span><input required value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} /></label><label className="admin-form-field"><span>Postal code</span><input required value={addressForm.postalCode} onChange={(event) => setAddressForm((current) => ({ ...current, postalCode: event.target.value }))} /></label></div><label className="admin-checkbox"><input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((current) => ({ ...current, isDefault: event.target.checked }))} /> Use as default delivery address</label><button className="admin-button" disabled={busy === "address"} type="submit">{busy === "address" ? "Saving…" : "Save address"}</button></form>}<div className="customer-address-list">{settings?.addresses.length ? settings.addresses.map((address) => <div className="customer-address-row" key={address._id}><div><strong>{address.label}{address.isDefault ? " · Default" : ""}</strong><small>{address.recipient} · {address.line1}, {address.city} {address.postalCode}</small></div><button className="admin-table-action is-muted" type="button" onClick={() => void run(() => removeAddress({ addressId: address._id }), String(address._id))}>Remove</button></div>) : <p className="admin-empty">No saved addresses yet.</p>}</div></article></div></section>;
}
