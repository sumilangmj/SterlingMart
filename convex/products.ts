import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    category: v.optional(v.string()),
    collection: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, { category, collection, featured }) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return products
      .filter((product) => !category || product.category === category)
      .filter((product) => !collection || product.collection === collection)
      .filter((product) => featured === undefined || product.featured === featured)
      .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || a.createdAt - b.createdAt);
  },
});

export const catalog = query({
  args: {
    search: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    collection: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    inStock: v.optional(v.boolean()),
    minPriceCents: v.optional(v.number()),
    maxPriceCents: v.optional(v.number()),
    sort: v.optional(v.union(v.literal("featured"), v.literal("newest"), v.literal("price-asc"), v.literal("price-desc"))),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    const search = args.search?.trim().toLowerCase();
    const selectedCategories = new Set(args.categories?.filter(Boolean));

    return products
      .filter((product) => selectedCategories.size === 0 || selectedCategories.has(product.category))
      .filter((product) => !args.collection || product.collection === args.collection)
      .filter((product) => args.featured === undefined || product.featured === args.featured)
      .filter((product) => !args.inStock || (product.stock ?? 0) > 0)
      .filter((product) => args.minPriceCents === undefined || product.priceCents >= args.minPriceCents)
      .filter((product) => args.maxPriceCents === undefined || product.priceCents <= args.maxPriceCents)
      .filter((product) => !search || [product.name, product.description, product.category, product.collection, product.material, product.gemstone, product.sku].filter(Boolean).join(" ").toLowerCase().includes(search))
      .sort((a, b) => {
        if (args.sort === "price-asc") return a.priceCents - b.priceCents;
        if (args.sort === "price-desc") return b.priceCents - a.priceCents;
        if (args.sort === "newest") return b.createdAt - a.createdAt;
        return Number(b.featured ?? false) - Number(a.featured ?? false) || a.createdAt - b.createdAt;
      });
  },
});

export const categories = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return [...new Set(products.map((product) => product.category))].sort();
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    return product?.isActive ? product : null;
  },
});
