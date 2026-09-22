"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/format";

export function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, subtotalCents, isLoading } = useCart();
  const createPending = useMutation(api.orders.createPending);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createPending({});
      router.push(`/checkout/success?order=${result.orderId}`);
    } catch {
      setError("We couldn’t create that order. Your cart is still safe—please try again.");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="shell page-section" data-scroll-reveal="checkout-loading"><div className="cart-skeleton" aria-busy="true" aria-label="Loading checkout" /></div>;
  }

  if (items.length === 0) {
    return (
      <section className="shell page-section empty-page" data-scroll-reveal="checkout-empty" aria-labelledby="checkout-heading">
        <p className="eyebrow">Checkout</p>
        <h1 id="checkout-heading">There’s nothing to check out.</h1>
        <p>Add a piece to your cart, then come back here when you’re ready.</p>
        <Link className="button button-dark" href="/collections">Browse the collection <span aria-hidden="true">→</span></Link>
      </section>
    );
  }

  return (
    <section className="shell page-section" data-scroll-reveal="checkout" aria-labelledby="checkout-heading">
      <div className="checkout-heading">
        <Link className="back-link" href="/cart">← Back to cart</Link>
        <p className="eyebrow">Order request</p>
        <h1 id="checkout-heading">One last look.</h1>
        <p>Confirm your selection and we’ll create a pending order for your private record.</p>
      </div>
      <div className="checkout-layout">
        <div className="checkout-items">
          {items.map((item) => (
            <div className="checkout-item" key={item.productId}>
              <span>{item.name} <small>× {item.quantity}</small></span>
              <strong>{formatPrice(item.lineTotalCents)}</strong>
            </div>
          ))}
          <div className="summary-row checkout-total"><span>{itemCount} items</span><strong>{formatPrice(subtotalCents)}</strong></div>
        </div>
        <div className="checkout-action">
          <div className="mock-note"><span className="mock-note-mark" aria-hidden="true">i</span><p>Your request is validated against live inventory and saved to your SterlingMart account. Payment and carrier fulfillment still require a configured provider.</p></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark button-wide" type="button" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Creating order…" : "Place order request"} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
