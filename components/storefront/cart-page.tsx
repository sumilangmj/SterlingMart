"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/format";
import type { ProductId } from "@/lib/types";

export function CartPage() {
  const { items, itemCount, subtotalCents, isLoading, setQuantity, removeItem } = useCart();
  const [busyId, setBusyId] = useState<ProductId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateItem(action: () => Promise<void>, productId: ProductId) {
    setBusyId(productId);
    setError(null);
    try {
      await action();
    } catch {
      setError("That update didn’t go through. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return <div className="shell page-section"><div className="cart-skeleton" aria-busy="true" aria-label="Loading cart" /></div>;
  }

  if (items.length === 0) {
    return (
      <section className="shell page-section empty-page" aria-labelledby="cart-heading">
        <p className="eyebrow">Your cart</p>
        <h1 id="cart-heading">A little more room to fill.</h1>
        <p>There’s nothing here yet. Start with a piece that feels entirely your own.</p>
        <Link className="button button-dark" href="/collections">Browse the collection <span aria-hidden="true">→</span></Link>
      </section>
    );
  }

  return (
    <section className="shell page-section" aria-labelledby="cart-heading">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Your cart</p>
          <h1 id="cart-heading">The pieces you picked.</h1>
        </div>
        <p className="item-count">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="cart-layout">
        <div className="cart-lines">
          {items.map((item) => (
            <article className="cart-line" key={item.productId}>
              <Link className="cart-line-image" href={`/products/${item.slug}`}>
                <Image src={item.imageUrl} alt={item.name} fill sizes="96px" />
              </Link>
              <div className="cart-line-copy">
                <p className="eyebrow">{item.category}</p>
                <h2><Link href={`/products/${item.slug}`}>{item.name}</Link></h2>
                <p>{formatPrice(item.priceCents)} each</p>
                <div className="quantity-row">
                  <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                    <button
                      type="button"
                      aria-label={`Decrease ${item.name} quantity`}
                      disabled={busyId === item.productId}
                      onClick={() => updateItem(() => setQuantity(item.productId, item.quantity - 1), item.productId)}
                    >−</button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase ${item.name} quantity`}
                      disabled={busyId === item.productId}
                      onClick={() => updateItem(() => setQuantity(item.productId, item.quantity + 1), item.productId)}
                    >+</button>
                  </div>
                  <button className="remove-button" type="button" onClick={() => updateItem(() => removeItem(item.productId), item.productId)}>Remove</button>
                </div>
              </div>
              <span className="cart-line-total">{formatPrice(item.lineTotalCents)}</span>
            </article>
          ))}
        </div>
        <aside className="summary-card" aria-labelledby="summary-heading">
          <p className="eyebrow">Summary</p>
          <h2 id="summary-heading">Ready when you are.</h2>
          <div className="summary-row"><span>Subtotal</span><strong>{formatPrice(subtotalCents)}</strong></div>
          <p className="summary-note">Your order request is checked against live inventory before it is saved. Payment and delivery are completed by the fulfillment team.</p>
          <Link className="button button-dark button-wide" href="/checkout">Continue to checkout <span aria-hidden="true">→</span></Link>
        </aside>
      </div>
    </section>
  );
}
