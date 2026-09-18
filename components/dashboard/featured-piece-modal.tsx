"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/format";
import type { TopPiece } from "@/components/dashboard/dashboard-panels";

type PieceDetails = {
  slug: string;
  name: string;
  description: string;
  category: string;
  collection?: string;
  material?: string;
  gemstone?: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
  featured: boolean;
};

export function FeaturedPieceModal({ piece, details, canManageCatalog, busy, onToggleFeatured, onClose }: { piece: TopPiece; details: PieceDetails | null | undefined; canManageCatalog: boolean; busy: boolean; onToggleFeatured: () => void; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const product = details ?? piece;
  const productKicker = details ? details.collection ?? details.category : "Top piece";

  useEffect(() => {
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
  }, [onClose]);

  return (
    <div className="featured-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="featured-modal dashboard-featured-piece-modal" role="dialog" aria-modal="true" aria-labelledby="dashboard-featured-title">
        <button ref={closeRef} className="featured-modal-close" type="button" aria-label="Close featured piece preview" onClick={onClose}>×</button>
        <div className="featured-modal-image">
          <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 700px) 100vw, 42vw" />
          {product.featured && <span className="featured-modal-badge">Signature edit</span>}
        </div>
        <div className="featured-modal-copy">
          <p className="eyebrow">{productKicker}</p>
          <h2 id="dashboard-featured-title">{product.name}</h2>
          <p className="featured-modal-description">{"description" in product ? product.description : "A top-performing piece from the live SterlingMart catalog."}</p>
          <div className="featured-modal-price-row"><strong>{formatPrice(product.priceCents)}</strong><span>{product.stock > 0 ? `${product.stock} available` : "Made to order"}</span></div>
          {details && <dl className="featured-modal-meta"><div><dt>Material</dt><dd>{details.material ?? "Fine jewelry finish"}</dd></div><div><dt>Stone</dt><dd>{details.gemstone ?? "Curated detail"}</dd></div><div><dt>Performance</dt><dd>{piece.unitsSold} sold</dd></div></dl>}
          <div className="featured-modal-actions">
            {canManageCatalog && <button className="button button-dark" type="button" disabled={busy} onClick={onToggleFeatured}>{busy ? "Saving…" : product.featured ? "Remove from signature edit" : "Add to signature edit"}<span aria-hidden="true">{product.featured ? "★" : "☆"}</span></button>}
            <Link className="featured-modal-detail-link" href={`/products/${product.slug}`} onClick={onClose}>Open full product page <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
