"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminPageHeader } from "@/components/dashboard/admin/admin-page-header";
import { WorkspaceLoadingState } from "@/components/dashboard/workspace/workspace-states";

export function AdminCollectionsPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const canQueryProtectedData = authLoaded && isSignedIn;
  const collections = useQuery(api.admin.collections, canQueryProtectedData ? {} : "skip");
  if (!canQueryProtectedData || collections === undefined) return <WorkspaceLoadingState label="collections" />;
  return (
    <section className="admin-section" aria-labelledby="admin-collections-heading">
      <AdminPageHeader eyebrow="Merchandising" title="Collections" description="Organize the live edit into the stories customers browse, save, and return to." action={<Link className="admin-button" href="/dashboard/admin/products">Edit products <span aria-hidden="true">→</span></Link>} />
      <div className="admin-collection-grid">{collections?.length ? collections.map((collection) => <article className="admin-collection-card" key={collection.name}><div className="admin-collection-card-top"><span className="admin-collection-mark" aria-hidden="true">✦</span><span>{collection.featuredCount} signature pieces</span></div><h3>{collection.name}</h3><p>{collection.productCount} live pieces · {collection.inventoryUnits} inventory units</p><div className="admin-collection-pieces">{collection.pieces.map((piece) => <span key={piece.id}>{piece.name}</span>)}</div><Link className="admin-text-link" href="/dashboard/admin/products">Manage collection <span aria-hidden="true">↗</span></Link></article>) : <div className="admin-empty-card">Collections will appear after the catalog loads.</div>}</div>
      <div className="admin-info-band"><strong>Collection names are catalog-driven.</strong><span>Update a product’s collection in Products and this page will regroup the live edit automatically.</span></div>
    </section>
  );
}
