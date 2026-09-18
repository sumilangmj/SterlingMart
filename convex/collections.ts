import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { requireProfile } from "./lib/access";

const collectionArgs = {
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  accent: v.string(),
  heroImageUrl: v.optional(v.string()),
  sortOrder: v.number(),
};

async function withCounts(ctx: QueryCtx, collections: Doc<"collections">[]) {
  const products = await ctx.db
    .query("products")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .collect();
  return collections.map((collection) => {
    const pieces = products.filter((product) => product.collection === collection.name);
    return {
      ...collection,
      productCount: pieces.length,
      inventoryUnits: pieces.reduce((sum, product) => sum + (product.stock ?? 0), 0),
      featuredCount: pieces.filter((product) => product.featured).length,
      pieces: pieces.slice(0, 4).map((product) => ({ id: product._id, name: product.name, slug: product.slug, imageUrl: product.imageUrl })),
    };
  });
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const collections = await ctx.db.query("collections").withIndex("by_active", (q) => q.eq("isActive", true)).collect();
    return withCounts(ctx, collections);
  },
});

export const workspaceList = query({
  args: {},
  handler: async (ctx) => {
    await requireProfile(ctx, ["admin", "staff", "vendor", "customer"]);
    const collections = await ctx.db.query("collections").collect();
    return withCounts(ctx, collections.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
  },
});

export const create = mutation({
  args: collectionArgs,
  handler: async (ctx, collection) => {
    await requireProfile(ctx, ["admin"]);
    const slug = collection.slug.trim().toLowerCase();
    if (!collection.name.trim() || !slug) throw new Error("Collection name and slug are required.");
    const existing = await ctx.db.query("collections").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (existing) throw new Error("That collection slug already exists.");
    const now = Date.now();
    return ctx.db.insert("collections", { ...collection, name: collection.name.trim(), slug, isActive: true, createdAt: now, updatedAt: now, heroImageUrl: collection.heroImageUrl?.trim() || undefined });
  },
});

export const update = mutation({
  args: { collectionId: v.id("collections"), name: v.optional(v.string()), description: v.optional(v.string()), accent: v.optional(v.string()), heroImageUrl: v.optional(v.string()), sortOrder: v.optional(v.number()), isActive: v.optional(v.boolean()) },
  handler: async (ctx, { collectionId, ...updates }) => {
    await requireProfile(ctx, ["admin", "staff"]);
    const collection = await ctx.db.get(collectionId);
    if (!collection) throw new Error("Collection not found.");
    await ctx.db.patch(collectionId, { ...updates, updatedAt: Date.now() });
    return collectionId;
  },
});
