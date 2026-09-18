"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCard } from "@/components/storefront/product-card";
import { FeaturedProductModal } from "@/components/storefront/featured-product-modal";
import type { Product } from "@/lib/types";
import { BrandLogo } from "@/components/branding/brand-logo";

export function StorefrontHome() {
  const [category, setCategory] = useState("All pieces");
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const categories = useQuery(api.products.categories, {});
  const products = useQuery(api.products.list, {
    category: category === "All pieces" ? undefined : category,
    featured: featuredOnly ? true : undefined,
  });
  const visibleProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return products;
    return products?.filter((product) => `${product.name} ${product.category} ${product.collection ?? ""}`.toLowerCase().includes(search));
  }, [products, searchTerm]);
  const closeQuickView = useCallback(() => setQuickViewProduct(null), []);

  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">Fine jewelry, thoughtfully made</p>
          <h1>Pieces that hold the light.</h1>
          <p className="hero-intro">
            Modern heirlooms in gold, diamonds, pearls, and colored stones—selected for the moments you keep.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/collections">Explore the collection <span aria-hidden="true">→</span></Link>
            <Link className="hero-text-link" href="/sign-up">Join the circle</Link>
          </div>
        </div>
        <div className="hero-art" aria-label="The SM Sterling Mart HD logo presented on dark gold marble" role="img">
          <div className="hero-art-note">No. 01<br />The signature edit</div>
          <BrandLogo className="hero-art-logo" priority />
          <span className="hero-art-label">STERLING / FINE JEWELRY</span>
        </div>
      </section>

      <section className="collection shell" id="collection" aria-labelledby="collection-heading">
        <div className="section-heading">
          <div>
          <p className="eyebrow">The collection</p>
          <h2 id="collection-heading">Modern heirlooms.</h2>
        </div>
          <p className="section-note">A curated edit of pieces designed to be worn, loved, and passed on. <Link className="section-note-link" href="/collections">Browse every piece ↗</Link></p>
        </div>

        <div className="collection-tools" aria-label="Filter the jewelry collection">
          <label className="collection-search">
            <span className="sr-only">Search jewelry</span>
            <span aria-hidden="true">⌕</span>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search the collection" type="search" />
          </label>
          <div className="collection-filters" role="group" aria-label="Jewelry categories">
            <button className={category === "All pieces" ? "is-active" : ""} onClick={() => setCategory("All pieces")} type="button">All pieces</button>
            {(categories ?? ["Rings", "Necklaces", "Earrings", "Bracelets", "Pendants"]).map((item) => <button className={category === item ? "is-active" : ""} key={item} onClick={() => setCategory(item)} type="button">{item}</button>)}
          </div>
          <label className="featured-toggle"><input checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} type="checkbox" /> <span>Signature edit</span></label>
        </div>

        {products === undefined ? (
          <div className="product-grid" aria-busy="true" aria-label="Loading products">
            {Array.from({ length: 6 }).map((_, index) => <div className="product-skeleton" key={index} />)}
          </div>
        ) : visibleProducts?.length === 0 ? (
          <div className="empty-state" role="status">
            <p className="eyebrow">A quiet shelf</p>
            <h3>No pieces found.</h3>
            <p>Try another search or browse every category.</p>
          </div>
        ) : (
          <div className="product-grid">
            {visibleProducts?.map((product) => <ProductCard key={product._id} product={product} onQuickView={() => setQuickViewProduct(product)} />)}
          </div>
        )}
      </section>

      <section className="manifesto-band">
        <div className="shell manifesto-inner">
          <p className="eyebrow">Our point of view</p>
          <p className="manifesto-copy">Jewelry should feel like you: considered, luminous, and entirely your own.</p>
          <Link className="underlined-link" href="/collections">Browse the edit <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
      {quickViewProduct && <FeaturedProductModal key={quickViewProduct._id} product={quickViewProduct} onClose={closeQuickView} />}
    </>
  );
}
