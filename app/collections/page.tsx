import type { Metadata } from "next";
import { CollectionsPage } from "@/components/storefront/collections-page";

export const metadata: Metadata = {
  title: "Collections",
  description: "Find your next SterlingMart heirloom by category, collection, price, and availability.",
};

export default function CollectionsRoute() {
  return <CollectionsPage />;
}
