import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getAuthenticatedConvexClient } from "@/lib/convex-server";
import { formatPrice } from "@/lib/format";

type SuccessPageProps = { searchParams: Promise<{ order?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { order } = await searchParams;
  const authenticated = await getAuthenticatedConvexClient();
  if (!authenticated) redirect(`/sign-in?redirect_url=/checkout/success?order=${order ?? ""}`);
  if (!order) notFound();

  let result;
  try {
    result = await authenticated.client.query(api.orders.byId, { orderId: order as Id<"orders"> });
  } catch {
    result = null;
  }
  if (!result) notFound();

  return (
    <section className="shell page-section confirmation-page" aria-labelledby="confirmation-heading">
      <div className="confirmation-mark" aria-hidden="true">✓</div>
      <p className="eyebrow">Order received</p>
      <h1 id="confirmation-heading">A good choice.</h1>
      <p className="confirmation-copy">Your mock order is pending. We’ll keep the details here while the real checkout takes shape.</p>
      <div className="confirmation-card">
        <div><span>Order reference</span><strong>{result._id.slice(-8).toUpperCase()}</strong></div>
        <div><span>Status</span><strong className="status-label">Pending</strong></div>
        <div><span>Subtotal</span><strong>{formatPrice(result.subtotalCents)}</strong></div>
      </div>
      <Link className="button button-dark" href="/dashboard">Go to your dashboard <span aria-hidden="true">→</span></Link>
    </section>
  );
}
