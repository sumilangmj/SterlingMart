"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { BrandLogo } from "@/components/branding/brand-logo";

export function SiteHeader() {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isCurrent = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMobileMenuOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", mobileMenuOpen);
    return () => document.body.classList.remove("mobile-menu-open");
  }, [mobileMenuOpen]);

  const navigation = (
    <>
      <Link className={isCurrent("/") ? "is-current" : ""} href="/" aria-current={isCurrent("/") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>Home</Link>
      <Link className={isCurrent("/about") ? "is-current" : ""} href="/about" aria-current={isCurrent("/about") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>About us</Link>
      <Link className={isCurrent("/collections") ? "is-current" : ""} href="/collections" aria-current={isCurrent("/collections") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>Collections</Link>
      <Link className={isCurrent("/contact") ? "is-current" : ""} href="/contact" aria-current={isCurrent("/contact") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
      <Link className={isCurrent("/cart") ? "is-current" : ""} href="/cart" aria-current={isCurrent("/cart") ? "page" : undefined} onClick={() => setMobileMenuOpen(false)}>Cart <span className="cart-count">{itemCount}</span></Link>
    </>
  );

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" href="/" aria-label="SterlingMart home">
          <BrandLogo className="wordmark-logo" priority />
        </Link>

        <nav className="main-nav" aria-label="Main navigation">{navigation}</nav>

        <div className="header-account">
          <Show
            when="signed-in"
            fallback={(
              <div className="header-auth-actions">
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="text-button" type="button">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="header-join-button" type="button">Create account</button>
                </SignUpButton>
              </div>
            )}
          >
            <Link className="text-button dashboard-link" href="/dashboard">Dashboard</Link>
            <UserButton />
          </Show>
        </div>

        <div className="mobile-header-actions">
          <Link className="mobile-cart-link" href="/cart" aria-label={`Cart, ${itemCount} items`}>
            <span aria-hidden="true">Bag</span>
            <span className="cart-count">{itemCount}</span>
          </Link>
          <button
            className={`mobile-menu-toggle${mobileMenuOpen ? " is-open" : ""}`}
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-navigation"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            <span className="mobile-menu-toggle-lines" aria-hidden="true"><i /><i /><i /></span>
            <span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-nav-panel" id="mobile-site-navigation">
          <nav aria-label="Mobile navigation" className="mobile-nav-links">{navigation}</nav>
          <div className="mobile-nav-account">
            <Show
              when="signed-in"
              fallback={(
                <>
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                    <button className="mobile-nav-sign-in" type="button">Sign in</button>
                  </SignInButton>
                  <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                    <button className="header-join-button" type="button">Create account</button>
                  </SignUpButton>
                </>
              )}
            >
              <Link className="mobile-nav-sign-in" href="/dashboard">Dashboard</Link>
              <UserButton />
            </Show>
          </div>
        </div>
      )}
    </header>
  );
}
