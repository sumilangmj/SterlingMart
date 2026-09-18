import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { CartProvider } from "@/components/cart/cart-provider";
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <CartProvider>
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
