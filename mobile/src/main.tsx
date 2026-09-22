import { ClerkProvider, useAuth } from "@clerk/react";
import { Clerk } from "@clerk/clerk-js";
import { Capacitor } from "@capacitor/core";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MobileApp } from "./mobile-app";
import "./styles.css";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!convexUrl || !clerkPublishableKey) {
  throw new Error("SterlingMart mobile configuration is incomplete.");
}

const convex = new ConvexReactClient(convexUrl);

function NativeRuntime() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    let removeBackButton = () => undefined;

    async function configureNativeRuntime() {
      try {
        const [{ App }, { SplashScreen }, { StatusBar, Style }] = await Promise.all([
          import("@capacitor/app"),
          import("@capacitor/splash-screen"),
          import("@capacitor/status-bar"),
        ]);
        if (disposed) return;

        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
        const listener = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack || window.history.length > 1) window.history.back();
          else void App.exitApp();
        });
        removeBackButton = () => void listener.remove();
        await SplashScreen.hide({ fadeOutDuration: 250 });
      } catch (error) {
        console.warn("Native runtime setup failed; continuing with the local app.", error);
        try {
          const { SplashScreen } = await import("@capacitor/splash-screen");
          await SplashScreen.hide({ fadeOutDuration: 250 });
        } catch {
          // The native plugin is optional when this file is opened in a browser.
        }
      }
    }

    void configureNativeRuntime();
    return () => {
      disposed = true;
      removeBackButton();
    };
  }, []);

  return null;
}

function Root() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} Clerk={Clerk}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <NativeRuntime />
        <MobileApp />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
