"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
if (!clerkPublishableKey) throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not configured.");

const convex = new ConvexReactClient(convexUrl);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      dynamic
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      appearance={{
        elements: {
          logoImage: "clerk-logo-image",
        },
        variables: {
        colorPrimary: "#9a6b2f",
        colorBackground: "#f7efdf",
        borderRadius: "0.2rem",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontFamilyButtons: "Arial, Helvetica, sans-serif",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
