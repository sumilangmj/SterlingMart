"use client";

import Link from "next/link";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="dashboard-route-error shell" data-scroll-reveal="dashboard-error" role="alert">
      <p className="dashboard-page-kicker">SterlingMart workspace</p>
      <h1>We couldn’t load this workspace</h1>
      <p>Something interrupted the live dashboard data request. Try again, or return to the storefront while the connection recovers.</p>
      <div className="dashboard-route-error-actions">
        <button className="admin-button" type="button" onClick={() => reset()}>Try again <span aria-hidden="true">↻</span></button>
        <Link className="admin-button admin-button-secondary" href="/">Back to storefront <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  );
}
