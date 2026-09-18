"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/cart/cart-provider";
import { FavoriteButton } from "@/components/storefront/favorite-button";

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    await addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <section className="product-detail shell">
      <div className={`detail-image product-image-${product.accent}`}>
        <Image src={product.imageUrl} alt={product.name} fill priority sizes="(max-width: 767px) 100vw, 58vw" />
      </div>
      <div className="detail-copy">
        <Link className="back-link" href="/collections">← Back to collection</Link>
        <div className="detail-kicker-row">
          <p className="eyebrow">{product.collection ?? product.category}</p>
          <FavoriteButton productId={product._id} />
        </div>
        <h1>{product.name}</h1>
        <p className="detail-description">{product.description}</p>
        <div className="detail-purchase">
          <div className="detail-price-row">
            <span className="detail-price">{formatPrice(product.priceCents)}</span>
            {product.rating && <span className="detail-rating">★ {product.rating} · {product.reviewCount ?? 0} reviews</span>}
          </div>
          <button className="button button-dark button-wide" type="button" onClick={handleAdd}>
            {added ? "Added to cart" : "Add to cart"} <span aria-hidden="true">{added ? "✓" : "→"}</span>
          </button>
        </div>
        <dl className="detail-meta">
          <div><dt>Material</dt><dd>{product.material ?? "Fine jewelry finish"}</dd></div>
          <div><dt>Stone</dt><dd>{product.gemstone ?? "Curated detail"}</dd></div>
          <div><dt>Shipping</dt><dd>Complimentary · insured</dd></div>
          <div><dt>Availability</dt><dd>{product.stock && product.stock > 0 ? `${product.stock} pieces available` : "Made to order"}</dd></div>
        </dl>
      </div>
    </section>
  );
}
