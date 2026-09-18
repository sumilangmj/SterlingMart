import type { Doc, Id } from "@/convex/_generated/dataModel";

export type Product = Doc<"products">;
export type ProductId = Id<"products">;
export type Role = "customer" | "staff" | "vendor" | "admin";

export type CartItem = {
  productId: ProductId;
  slug: string;
  name: string;
  category: string;
  imageUrl: string;
  priceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type GuestCartItem = {
  productId: ProductId;
  quantity: number;
  product: Pick<Product, "slug" | "name" | "category" | "imageUrl" | "priceCents">;
};
