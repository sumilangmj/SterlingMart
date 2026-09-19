import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { CartProvider } from "@/components/cart/cart-provider";
import { MobileRuntime } from "@/components/mobile/mobile-runtime";
import { SiteChrome } from "@/components/storefront/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "SterlingMart — Modern heirlooms, beautifully chosen",
    template: "%s — SterlingMart",
  },
  description: "A considered collection of fine jewelry in gold, diamonds, pearls, and colored stones.",
  applicationName: "SM Sterling Mart",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "SM Sterling Mart — Modern heirlooms, beautifully chosen",
    description: "A considered collection of fine jewelry in gold, diamonds, pearls, and colored stones.",
    siteName: "SM Sterling Mart",
    type: "website",
    images: [{ url: "/sterling-mart-logo.png", width: 1308, height: 864, alt: "SM Sterling Mart logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SM Sterling Mart — Modern heirlooms, beautifully chosen",
    description: "A considered collection of fine jewelry in gold, diamonds, pearls, and colored stones.",
    images: ["/sterling-mart-logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2f1b10",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <CartProvider>
            <MobileRuntime />
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
