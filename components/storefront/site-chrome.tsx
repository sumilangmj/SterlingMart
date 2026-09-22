"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { SiteHeader } from "@/components/storefront/site-header";
import { BrandLogo } from "@/components/branding/brand-logo";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  useEffect(() => {
    const root = document.querySelector("main");
    if (!root) return;

    const observed = new WeakSet<HTMLElement>();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealObserver = reduceMotion || !("IntersectionObserver" in window)
      ? null
      : new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    const registerElements = () => {
      root.querySelectorAll<HTMLElement>("[data-scroll-reveal]").forEach((element, index) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.classList.add("scroll-reveal");
        element.style.setProperty("--reveal-delay", `${Math.min(index * 55, 220)}ms`);
        if (revealObserver) revealObserver.observe(element);
        else element.classList.add("is-visible");
      });
    };

    registerElements();
    const mutationObserver = new MutationObserver(registerElements);
    mutationObserver.observe(root, { childList: true, subtree: true });

    let frame = 0;
    const updateParallax = () => {
      frame = 0;
      if (reduceMotion) return;
      root.querySelectorAll<HTMLElement>("[data-scroll-parallax]").forEach((element) => {
        const distanceFromCenter = window.innerHeight / 2 - element.getBoundingClientRect().top;
        element.style.setProperty("--parallax-y", `${Math.max(-18, Math.min(18, distanceFromCenter * 0.035))}px`);
      });
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateParallax);
    };
    updateParallax();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      mutationObserver.disconnect();
      revealObserver?.disconnect();
    };
  }, [pathname]);

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
