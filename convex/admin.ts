import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { isLiveOrder } from "./lib/orders";

const getAdmin = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .unique();
  if (profile?.role !== "admin") throw new Error("Only administrators can access this workspace.");
  return profile;
};

export const products = query({
  args: { search: v.optional(v.string()), activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { search, activeOnly }) => {
    await getAdmin(ctx);
    const needle = search?.trim().toLowerCase();
    const rows = await ctx.db.query("products").collect();
    return rows
      .filter((product) => activeOnly === undefined || product.isActive === activeOnly)
      .filter((product) => !needle || `${product.name} ${product.category} ${product.collection ?? ""} ${product.sku ?? ""}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name));
  },
});

export const orders = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    await getAdmin(ctx);
    const rows = status
      ? await ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", status as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled")).collect()
      : await ctx.db.query("orders").withIndex("by_createdAt").collect();
    return rows.filter(isLiveOrder)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((order) => ({
        id: order._id,
        orderNumber: order._id.slice(-6).toUpperCase(),
        customer: order.customerName ?? "Sterling customer",
        email: order.customerEmail ?? "—",
        city: order.shippingCity ?? "—",
        itemName: order.items[0]?.name ?? "Jewelry order",
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        amountCents: order.subtotalCents,
        status: order.status,
        trackingNumber: order.trackingNumber ?? "—",
        createdAt: order.createdAt,
      }));
  },
});

export const collections = query({
  args: {},
  handler: async (ctx) => {
    await getAdmin(ctx);
    const [collections, products] = await Promise.all([
      ctx.db.query("collections").collect(),
      ctx.db.query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect(),
    ]);
    return collections
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((collection) => {
        const pieces = products.filter((product) => product.collection === collection.name);
        return {
          ...collection,
          productCount: pieces.length,
          featuredCount: pieces.filter((product) => product.featured).length,
          inventoryUnits: pieces.reduce((sum, product) => sum + (product.stock ?? 0), 0),
          pieces: pieces.slice(0, 4).map((product) => ({ id: product._id, name: product.name, slug: product.slug })),
        };
      });
  },
});

export const customers = query({
  args: {},
  handler: async (ctx) => {
    await getAdmin(ctx);
    const [profiles, allOrders, favorites] = await Promise.all([
      ctx.db.query("profiles").collect(),
      ctx.db.query("orders").withIndex("by_userId").collect(),
      ctx.db.query("favorites").withIndex("by_userId").collect(),
    ]);
    const orders = allOrders.filter(isLiveOrder);
    return profiles
      .map((profile) => {
        const profileOrders = orders.filter((order) => order.userId === profile.userId && order.status !== "cancelled");
        return {
          id: profile._id,
          userId: profile.userId,
          name: profile.displayName,
          email: profile.email,
          role: profile.role,
          orderCount: profileOrders.length,
          spendCents: profileOrders.reduce((sum, order) => sum + order.subtotalCents, 0),
          savedPieces: favorites.filter((favorite) => favorite.userId === profile.userId).length,
          joinedAt: profile.createdAt,
        };
      })
      .sort((a, b) => b.joinedAt - a.joinedAt);
  },
});

export const createProduct = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    category: v.string(),
    collection: v.string(),
    sku: v.string(),
    material: v.string(),
    gemstone: v.string(),
    priceCents: v.number(),
    imageUrl: v.string(),
    accent: v.string(),
    stock: v.number(),
    featured: v.boolean(),
    vendorName: v.string(),
  },
  handler: async (ctx, product) => {
    await getAdmin(ctx);
    if (!product.name.trim() || !product.slug.trim()) throw new Error("Product name and slug are required.");
    if (!Number.isInteger(product.priceCents) || product.priceCents < 0) throw new Error("Price must be a non-negative whole number in cents.");
    if (!Number.isInteger(product.stock) || product.stock < 0) throw new Error("Stock must be a non-negative whole number.");
    const existing = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", product.slug.trim())).unique();
    if (existing) throw new Error("A product with that slug already exists.");
    return ctx.db.insert("products", { ...product, isActive: true, createdAt: Date.now() });
  },
});

export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    priceCents: v.optional(v.number()),
    stock: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { productId, ...updates }) => {
    await getAdmin(ctx);
    if (updates.priceCents !== undefined && (!Number.isInteger(updates.priceCents) || updates.priceCents < 0)) throw new Error("Price must be a non-negative whole number in cents.");
    if (updates.stock !== undefined && (!Number.isInteger(updates.stock) || updates.stock < 0)) throw new Error("Stock must be a non-negative whole number.");
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found.");
    await ctx.db.patch(productId, updates);
    return productId;
  },
});

export const archiveProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    await getAdmin(ctx);
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found.");
    await ctx.db.patch(productId, { isActive: !product.isActive });
    return !product.isActive;
  },
});
