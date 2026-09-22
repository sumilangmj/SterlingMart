"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

function navigateToAppUrl(url: string, navigate: (href: string) => void) {
  try {
    const target = new URL(url);
    const current = new URL(window.location.href);
    if (target.pathname === current.pathname && target.search === current.search && target.hash === current.hash) return;
    navigate(`${target.pathname}${target.search}${target.hash}`);
  } catch {
    // Ignore malformed external URLs rather than interrupting the app shell.
  }
}

export function MobileRuntime() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    const listeners: Array<{ remove: () => Promise<void> }> = [];

    async function configureNativeShell() {
      try {
        const [{ App }, { StatusBar, Style }] = await Promise.all([
          import("@capacitor/app"),
          import("@capacitor/status-bar"),
        ]);

        if (disposed) return;

        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });

        const launchUrl = await App.getLaunchUrl();
        if (launchUrl?.url) navigateToAppUrl(launchUrl.url, (href) => router.replace(href));

        listeners.push(
          await App.addListener("appUrlOpen", ({ url }) => navigateToAppUrl(url, (href) => router.replace(href))),
          await App.addListener("backButton", ({ canGoBack }) => {
            if (canGoBack) {
              window.history.back();
              return;
            }
            void App.exitApp();
          }),
        );
      } catch (error) {
        console.warn("Native shell setup failed; continuing with the storefront.", error);
      } finally {
        // Never leave a native user on the splash screen if an optional plugin
        // or deep-link setup is unavailable.
        try {
          const { SplashScreen } = await import("@capacitor/splash-screen");
          await SplashScreen.hide({ fadeOutDuration: 250 });
        } catch (error) {
          console.warn("Native splash cleanup failed.", error);
        }
      }
    }

    void configureNativeShell();
    return () => {
      disposed = true;
      for (const listener of listeners) void listener.remove();
    };
  }, [router]);

  return null;
}
