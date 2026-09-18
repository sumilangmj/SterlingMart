"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FavoriteButton } from "@/components/storefront/favorite-button";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function FeaturedProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!product) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, product]);

  if (!product) return null;
  const selectedProduct = product;

  async function handleAdd() {
    setIsAdding(true);
    setError(null);
    try {
      await addItem(selectedProduct);
      setAdded(true);
    } catch {
      setError("That piece could not be added right now. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="featured-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="featured-modal" role="dialog" aria-modal="true" aria-labelledby="featured-modal-title">
        <button ref={closeRef} className="featured-modal-close" type="button" aria-label="Close product preview" onClick={onClose}>×</button>
        <div className={`featured-modal-image product-image-${product.accent}`}>
          <Image src={selectedProduct.imageUrl} alt={selectedProduct.name} fill sizes="(max-width: 700px) 100vw, 42vw" />
          {selectedProduct.featured && <span className="featured-modal-badge">Signature edit</span>}
        </div>
        <div className="featured-modal-copy">
          <div className="featured-modal-kicker-row">
            <p className="eyebrow">{selectedProduct.collection ?? selectedProduct.category}</p>
            <span className="featured-modal-favorite"><FavoriteButton productId={selectedProduct._id} /></span>
          </div>
          <h2 id="featured-modal-title">{selectedProduct.name}</h2>
          <p className="featured-modal-description">{selectedProduct.description}</p>
          <div className="featured-modal-price-row"><strong>{formatPrice(selectedProduct.priceCents)}</strong><span>{selectedProduct.stock && selectedProduct.stock > 0 ? `${selectedProduct.stock} available` : "Made to order"}</span></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="featured-modal-actions">
            <button className="button button-dark" type="button" disabled={isAdding} onClick={() => void handleAdd()}>{isAdding ? "Adding…" : added ? "Added to cart" : "Add to cart"}<span aria-hidden="true">{added ? "✓" : "→"}</span></button>
            <Link className="featured-modal-detail-link" href={`/products/${selectedProduct.slug}`} onClick={onClose}>View full story <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
