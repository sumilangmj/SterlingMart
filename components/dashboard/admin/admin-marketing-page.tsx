"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice } from "@/lib/format";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

export function AdminMarketingPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const canQueryProtectedData = authLoaded && isSignedIn;
  const [search, setSearch] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignBusy, setCampaignBusy] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: "", headline: "", description: "", channel: "storefront" as "storefront" | "email" | "social", budget: "" });
  const [busyProduct, setBusyProduct] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const products = useQuery(api.admin.products, canQueryProtectedData ? { activeOnly: true } : "skip");
  const campaigns = useQuery(api.campaigns.list, canQueryProtectedData ? {} : "skip");
  const updateProduct = useMutation(api.admin.updateProduct);
  const createCampaign = useMutation(api.campaigns.create);
  const updateCampaignStatus = useMutation(api.campaigns.updateStatus);
  const visibleProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (products ?? []).filter((product) => (!featuredOnly || product.featured) && (!needle || `${product.name} ${product.category} ${product.collection ?? ""}`.toLowerCase().includes(needle)));
  }, [featuredOnly, products, search]);

  if (!canQueryProtectedData || products === undefined || campaigns === undefined) return <WorkspaceLoadingState label="marketing" />;

  async function toggleFeatured(productId: string, featured: boolean) {
    setBusyProduct(productId);
    setError(null);
    try {
      await updateProduct({ productId: productId as Id<"products">, featured: !featured });
    } catch {
      setError("The featured placement could not be saved.");
    } finally {
      setBusyProduct(null);
    }
  }

  async function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCampaignBusy(true);
    setError(null);
    try {
      await createCampaign({ ...campaignForm, status: "draft", budgetCents: Math.round(Number(campaignForm.budget || 0) * 100), startsAt: Date.now(), endsAt: Date.now() + 30 * 86_400_000 });
      setCampaignForm({ name: "", headline: "", description: "", channel: "storefront", budget: "" });
      setShowCampaignForm(false);
    } catch {
      setError("The campaign could not be created.");
    } finally {
      setCampaignBusy(false);
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-marketing-heading">
      <AdminPageHeader eyebrow="Brand storytelling" title="Marketing" description="Shape the signature edit customers see first, using live product placements and campaign workstreams." action={<div className="admin-header-actions"><button className="admin-button" type="button" onClick={() => setShowCampaignForm((current) => !current)}>{showCampaignForm ? "Close form" : "New campaign"} <span aria-hidden="true">{showCampaignForm ? "×" : "＋"}</span></button><Link className="admin-button admin-button-secondary" href="/collections">View storefront <span aria-hidden="true">↗</span></Link></div>} />
      <div className="admin-toolbar"><label className="admin-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search marketing pieces</span><input type="search" placeholder="Search the signature edit" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="admin-check-filter"><input checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} type="checkbox" /> Signature pieces only</label><span className="admin-toolbar-count">{visibleProducts.length} placement{visibleProducts.length === 1 ? "" : "s"}</span></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {showCampaignForm && <form className="admin-form-card" onSubmit={(event) => void submitCampaign(event)}><div className="admin-form-grid"><label className="admin-form-field"><span>Campaign name</span><input required value={campaignForm.name} onChange={(event) => setCampaignForm((current) => ({ ...current, name: event.target.value }))} /></label><label className="admin-form-field"><span>Channel</span><select value={campaignForm.channel} onChange={(event) => setCampaignForm((current) => ({ ...current, channel: event.target.value as typeof current.channel }))}><option value="storefront">Storefront</option><option value="email">Email</option><option value="social">Social</option></select></label><label className="admin-form-field"><span>Budget (USD)</span><input min="0" step="0.01" type="number" value={campaignForm.budget} onChange={(event) => setCampaignForm((current) => ({ ...current, budget: event.target.value }))} /></label><label className="admin-form-field admin-form-field-wide"><span>Headline</span><input required value={campaignForm.headline} onChange={(event) => setCampaignForm((current) => ({ ...current, headline: event.target.value }))} /></label><label className="admin-form-field admin-form-field-wide"><span>Description</span><textarea rows={3} value={campaignForm.description} onChange={(event) => setCampaignForm((current) => ({ ...current, description: event.target.value }))} /></label></div><button className="admin-button" disabled={campaignBusy} type="submit">{campaignBusy ? "Creating…" : "Create campaign"}</button></form>}
      <div className="admin-marketing-grid">{visibleProducts.length ? visibleProducts.map((product) => <article className="admin-marketing-card" key={product._id}><div className="admin-marketing-image"><Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 760px) 50vw, 220px" /><span>{product.featured ? "Signature" : "Catalog"}</span></div><div className="admin-marketing-copy"><div><p>{product.collection ?? "Unassigned collection"}</p><h3>{product.name}</h3><span>{product.category} · {product.vendorName ?? "SterlingMart Atelier"}</span></div><strong>{formatPrice(product.priceCents)}</strong></div><button className={`admin-feature-button${product.featured ? " is-featured" : ""}`} disabled={busyProduct === product._id} type="button" onClick={() => void toggleFeatured(product._id, Boolean(product.featured))}>{busyProduct === product._id ? "Saving…" : product.featured ? "Remove from signature edit" : "Feature this piece"}<span aria-hidden="true">{product.featured ? "★" : "☆"}</span></button></article>) : <div className="admin-empty-card">No live products match this marketing view.</div>}</div>
      <div className="admin-table-card admin-campaign-table"><div className="admin-card-heading"><div><p className="admin-card-kicker">Campaign workstreams</p><h3>Campaign calendar</h3></div><span>{campaigns?.length ?? 0} campaigns</span></div><table className="admin-table"><thead><tr><th>Campaign</th><th>Channel</th><th>Budget</th><th>Status</th></tr></thead><tbody>{campaigns?.length ? campaigns.map((campaign) => <tr key={campaign._id}><td><strong>{campaign.name}</strong><small>{campaign.headline}</small></td><td>{campaign.channel}</td><td>{formatPrice(campaign.budgetCents)}</td><td><select className="admin-status admin-status-pending" value={campaign.status} onChange={(event) => void updateCampaignStatus({ campaignId: campaign._id, status: event.target.value as "draft" | "scheduled" | "live" | "ended" })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="ended">Ended</option></select></td></tr>) : <tr><td colSpan={4}><span className="admin-empty">No campaigns yet. Create a campaign above to keep the calendar connected.</span></td></tr>}</tbody></table></div>
      <div className="admin-info-band"><strong>Marketing is connected to Products.</strong><span>Feature or unfeature a piece here and the storefront’s curated collection updates from the same Convex record.</span></div>
    </section>
  );
}
