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
      const [{ App }, { SplashScreen }, { StatusBar, Style }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/splash-screen"),
        import("@capacitor/status-bar"),
      ]);

      if (disposed) return;

      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Dark });
      await SplashScreen.hide({ fadeOutDuration: 250 });

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
    }

    void configureNativeShell();
    return () => {
      disposed = true;
      for (const listener of listeners) void listener.remove();
    };
  }, [router]);

  return null;
}
