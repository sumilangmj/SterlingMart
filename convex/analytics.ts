import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/access";
import { isLiveOrder } from "./lib/orders";

type DataCtx = QueryCtx | MutationCtx;

async function calculate(ctx: DataCtx, role: string, userId: string) {
  const products = (role === "vendor"
    ? await ctx.db.query("products").withIndex("by_vendorUserId", (q) => q.eq("vendorUserId", userId)).collect()
    : await ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true)).collect())
    .filter((product) => product.isActive);
  const allOrders = (await ctx.db.query("orders").withIndex("by_createdAt").collect()).filter(isLiveOrder);
  const productIds = new Set(products.map((product) => product._id));
  const visibleOrders = role === "customer"
    ? allOrders.filter((order) => order.userId === userId)
    : role === "vendor"
      ? allOrders.filter((order) => order.items.some((item) => productIds.has(item.productId)))
      : allOrders;
  const activeOrders = visibleOrders.filter((order) => order.status !== "cancelled");
  const revenueCents = activeOrders.reduce((sum, order) => sum + order.subtotalCents, 0);
  const inventoryUnits = products.reduce((sum, product) => sum + (product.stock ?? 0), 0);
  const lowStock = products.filter((product) => (product.stock ?? 0) <= 12).length;
  const categoryMix = [...products.reduce((map, product) => map.set(product.category, (map.get(product.category) ?? 0) + (product.stock ?? 0)), new Map<string, number>()).entries()].map(([label, value]) => ({ label, value }));
  const movement = new Map<string, number>();
  for (const order of activeOrders) for (const item of order.items) movement.set(item.productId, (movement.get(item.productId) ?? 0) + item.quantity);
  const topProducts = [...products].sort((a, b) => (movement.get(b._id) ?? 0) - (movement.get(a._id) ?? 0)).slice(0, 5).map((product) => ({ id: product._id, name: product.name, unitsSold: movement.get(product._id) ?? 0, priceCents: product.priceCents }));
  return { revenueCents, orderCount: visibleOrders.length, averageOrderValueCents: activeOrders.length ? Math.round(revenueCents / activeOrders.length) : 0, inventoryUnits, lowStock, categoryMix, topProducts };
}

function scopeForRole(role: string) {
  return role === "customer" ? "customer" : role === "vendor" ? "vendor" : role === "staff" ? "staff" : "store";
}

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const { identity, profile } = await requireProfile(ctx);
    return { scope: scopeForRole(profile.role), ...(await calculate(ctx, profile.role, identity.subject)) };
  },
});

export const snapshots = query({
  args: {},
  handler: async (ctx) => {
    const { identity, profile } = await requireProfile(ctx);
    const scope = scopeForRole(profile.role);
    const snapshots = scope === "store"
      ? await ctx.db.query("analyticsSnapshots").withIndex("by_scope", (q) => q.eq("scope", scope)).collect()
      : await ctx.db.query("analyticsSnapshots").withIndex("by_scope_owner", (q) => q.eq("scope", scope).eq("ownerId", identity.subject)).collect();
    return snapshots.sort((a, b) => b.capturedAt - a.capturedAt).slice(0, 12);
  },
});

export const capture = mutation({
  args: { period: v.string() },
  handler: async (ctx, { period }) => {
    const { identity, profile } = await requireProfile(ctx);
    if (!period.trim()) throw new Error("Snapshot period is required.");
    const scope = scopeForRole(profile.role);
    const values = await calculate(ctx, profile.role, identity.subject);
    return ctx.db.insert("analyticsSnapshots", { scope, ownerId: scope === "store" ? undefined : identity.subject, period: period.trim(), revenueCents: values.revenueCents, orderCount: values.orderCount, averageOrderValueCents: values.averageOrderValueCents, inventoryUnits: values.inventoryUnits, lowStock: values.lowStock, capturedAt: Date.now() });
  },
});
