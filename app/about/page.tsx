import type { Metadata } from "next";
import { AboutPage } from "@/components/storefront/about-page";

export const metadata: Metadata = { title: "About us" };

export default function AboutRoute() {
  return <AboutPage />;
}
