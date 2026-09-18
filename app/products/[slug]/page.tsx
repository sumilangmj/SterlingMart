import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getPublicConvexClient } from "@/lib/convex-server";
import { ProductDetail } from "@/components/storefront/product-detail";

type ProductPageProps = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  return getPublicConvexClient().query(api.products.bySlug, { slug });
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
