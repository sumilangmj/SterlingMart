"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { BrandLogo } from "@/components/branding/brand-logo";

export function SiteHeader() {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const isCurrent = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" href="/" aria-label="SterlingMart home">
          <BrandLogo className="wordmark-logo" priority />
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          <Link className={isCurrent("/") ? "is-current" : ""} href="/" aria-current={isCurrent("/") ? "page" : undefined}>Home</Link>
          <Link className={isCurrent("/about") ? "is-current" : ""} href="/about" aria-current={isCurrent("/about") ? "page" : undefined}>About us</Link>
          <Link className={isCurrent("/collections") ? "is-current" : ""} href="/collections" aria-current={isCurrent("/collections") ? "page" : undefined}>Collections</Link>
          <Link className={isCurrent("/contact") ? "is-current" : ""} href="/contact" aria-current={isCurrent("/contact") ? "page" : undefined}>Contact</Link>
          <Link className={isCurrent("/cart") ? "is-current" : ""} href="/cart" aria-current={isCurrent("/cart") ? "page" : undefined}>Cart <span className="cart-count">{itemCount}</span></Link>
        </nav>

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
      </div>
    </header>
  );
}
