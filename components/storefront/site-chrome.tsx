"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/storefront/site-header";
import { BrandLogo } from "@/components/branding/brand-logo";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <>
      {!isDashboard && <SiteHeader />}
      <main>{children}</main>
      {!isDashboard && (
        <footer className="site-footer">
          <div className="shell footer-inner">
            <div className="footer-brand-block"><BrandLogo className="footer-brand-logo" /><p>Fine pieces, chosen with intention.</p></div>
            <nav className="footer-nav" aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/about">About us</Link><Link href="/collections">Collections</Link><Link href="/contact">Contact</Link></nav>
            <p>© 2026 SterlingMart</p>
          </div>
        </footer>
      )}
    </>
  );
}
