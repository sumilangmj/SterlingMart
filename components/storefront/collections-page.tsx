"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FeaturedProductModal } from "@/components/storefront/featured-product-modal";
import { ProductCard } from "@/components/storefront/product-card";
import type { Product } from "@/lib/types";

const fallbackCategories = ["Rings", "Necklaces", "Earrings", "Bracelets", "Pendants"];
const priceBands = [
  { id: "under-1000", label: "Under $1,000", minPriceCents: undefined, maxPriceCents: 100000 },
  { id: "1000-2500", label: "$1,000 – $2,500", minPriceCents: 100000, maxPriceCents: 250000 },
  { id: "over-2500", label: "Over $2,500", minPriceCents: 250000, maxPriceCents: undefined },
] as const;

type PriceBand = (typeof priceBands)[number]["id"];
type SortOrder = "featured" | "newest" | "price-asc" | "price-desc";

export function CollectionsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceBand, setSelectedPriceBand] = useState<PriceBand | "">("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [signatureOnly, setSignatureOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortOrder>("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const deferredSearch = useDeferredValue(search);
  const categories = useQuery(api.products.categories, {});
  const collections = useQuery(api.collections.list, {});
  const priceBand = priceBands.find((band) => band.id === selectedPriceBand);
  const products = useQuery(api.products.catalog, {
    search: deferredSearch.trim() || undefined,
    categories: selectedCategories.length ? selectedCategories : undefined,
    collection: selectedCollection || undefined,
    featured: signatureOnly ? true : undefined,
    inStock: inStockOnly ? true : undefined,
    minPriceCents: priceBand?.minPriceCents,
    maxPriceCents: priceBand?.maxPriceCents,
    sort,
  });
  const categoryOptions = categories ?? fallbackCategories;
  const closeQuickView = useCallback(() => setQuickViewProduct(null), []);
  const activeFilterCount = selectedCategories.length + Number(Boolean(selectedPriceBand)) + Number(Boolean(selectedCollection)) + Number(signatureOnly) + Number(inStockOnly);
  const resultLabel = products === undefined ? "Curating the edit" : `${products.length} ${products.length === 1 ? "piece" : "pieces"}`;

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedPriceBand("");
    setSelectedCollection("");
    setSignatureOnly(false);
    setInStockOnly(false);
    setSort("featured");
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  };

  const selectedSummary = useMemo(() => {
    const summary = [...selectedCategories];
    if (selectedCollection) summary.push(selectedCollection);
    if (selectedPriceBand) summary.push(priceBands.find((band) => band.id === selectedPriceBand)?.label ?? "Price");
    if (signatureOnly) summary.push("Signature edit");
    if (inStockOnly) summary.push("In stock");
    return summary;
  }, [inStockOnly, selectedCategories, selectedCollection, selectedPriceBand, signatureOnly]);

  return (
    <main className="collections-page">
      <section className="collections-hero shell" aria-labelledby="collections-heading">
        <div className="collections-hero-copy">
          <p className="eyebrow">The complete edit</p>
          <h1 id="collections-heading">Find what feels like you.</h1>
          <p>Explore every SterlingMart piece by silhouette, story, price, and availability. Your next heirloom is closer than you think.</p>
          <Link className="hero-text-link" href="/#collection">See the signature edit <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="collections-hero-card" aria-label="SterlingMart collection index" role="img">
          <span>SM / COLLECTIONS</span>
          <strong>Quiet<br />brilliance.</strong>
          <i aria-hidden="true" />
          <small>GOLD · DIAMONDS · PEARLS</small>
        </div>
      </section>

      <section className="collections-browser shell" aria-label="Browse the SterlingMart catalog">
        <aside className="collections-filters" aria-label="Collection filters">
          <div className="collections-filter-heading">
            <div><p className="eyebrow">Refine your edit</p><h2>Filter</h2></div>
            {activeFilterCount > 0 && <button className="collections-clear-button" type="button" onClick={clearFilters}>Clear all</button>}
          </div>

          <fieldset className="collections-filter-group">
            <legend>Jewelry type</legend>
            <div className="collections-checklist">
              {categoryOptions.map((category) => <label className="collections-checkbox" key={category}><input checked={selectedCategories.includes(category)} onChange={() => toggleCategory(category)} type="checkbox" /><span>{category}</span></label>)}
            </div>
          </fieldset>

          <fieldset className="collections-filter-group">
            <legend>Price</legend>
            <div className="collections-checklist">
              {priceBands.map((band) => <label className="collections-checkbox" key={band.id}><input checked={selectedPriceBand === band.id} onChange={() => setSelectedPriceBand((current) => current === band.id ? "" : band.id)} name="price-band" type="checkbox" /><span>{band.label}</span></label>)}
            </div>
          </fieldset>

          {collections?.length ? <label className="collections-select-field"><span>Collection story</span><select value={selectedCollection} onChange={(event) => setSelectedCollection(event.target.value)}><option value="">All stories</option>{collections.map((collection) => <option key={collection._id} value={collection.name}>{collection.name}</option>)}</select></label> : null}

          <div className="collections-filter-group collections-switches">
            <label className="collections-checkbox"><input checked={signatureOnly} onChange={(event) => setSignatureOnly(event.target.checked)} type="checkbox" /><span>Signature edit only</span></label>
            <label className="collections-checkbox"><input checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} type="checkbox" /><span>Available now</span></label>
          </div>
          <p className="collections-filter-note">Filters update from the live SterlingMart catalog.</p>
        </aside>

        <div className="collections-results" id="collection-grid">
          <div className="collections-toolbar">
            <div><p className="eyebrow">Your selection</p><p className="collections-result-count" aria-live="polite">{resultLabel}</p></div>
            <label className="collections-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search the catalog</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, stone, or SKU" /></label>
            <label className="collections-sort"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)}><option value="featured">Signature first</option><option value="newest">Newest arrivals</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
          </div>
          {selectedSummary.length > 0 && <div className="collections-active-filters" aria-label="Active filters">{selectedSummary.map((item) => <span key={item}>{item}</span>)}</div>}

          {products === undefined ? <div className="product-grid collections-grid" aria-busy="true" aria-label="Loading collection"><div className="product-skeleton" /><div className="product-skeleton" /><div className="product-skeleton" /><div className="product-skeleton" /></div> : products.length === 0 ? <div className="collections-empty" role="status"><p className="eyebrow">A quiet shelf</p><h2>No pieces match this edit.</h2><p>Try clearing one filter or searching for another material, silhouette, or collection.</p><button className="button button-dark" type="button" onClick={clearFilters}>Reset the edit <span aria-hidden="true">↗</span></button></div> : <div className="product-grid collections-grid">{products.map((product) => <ProductCard key={product._id} product={product} onQuickView={() => setQuickViewProduct(product)} />)}</div>}
        </div>
      </section>
      {quickViewProduct && <FeaturedProductModal key={quickViewProduct._id} product={quickViewProduct} onClose={closeQuickView} />}
    </main>
  );
}
