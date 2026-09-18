import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";

const MAX_ORDER_QUANTITY = 99;

const getUserId = async (ctx: Pick<QueryCtx, "auth">) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  return identity.subject as string;
};

export const createPending = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const cart = await ctx.db
      .query("carts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!cart?.items.length) throw new Error("Your cart is empty.");

    const items = [];
    for (const line of cart.items) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_ORDER_QUANTITY) {
        throw new Error("Each product quantity must be between 1 and 99.");
      }
      const product = await ctx.db.get(line.productId);
      if (!product?.isActive) throw new Error("Your cart contains an unavailable product.");
      if (product.stock !== undefined && line.quantity > product.stock) {
        throw new Error(`${product.name} has only ${product.stock} available.`);
      }
      items.push({
        productId: product._id,
        name: product.name,
        priceCents: product.priceCents,
        quantity: line.quantity,
      });
    }

    const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
    const identity = await ctx.auth.getUserIdentity();
    const orderId = await ctx.db.insert("orders", {
      userId,
      items,
      subtotalCents,
      status: "pending",
      customerName: identity?.name ?? identity?.nickname ?? undefined,
      customerEmail: identity?.email ?? undefined,
      createdAt: Date.now(),
    });
    await ctx.db.patch(cart._id, { items: [], updatedAt: Date.now() });
    await ctx.db.insert("notifications", {
      userId,
      title: "Order received",
      message: `Order ${orderId.slice(-6).toUpperCase()} is pending and ready for the next fulfillment step.`,
      kind: "order",
      read: false,
      createdAt: Date.now(),
    });
    return { orderId, subtotalCents };
  },
});

export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, { orderId, status }) => {
    const identity = await getUserId(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity))
      .unique();
    if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
      throw new Error("Only staff or admin accounts can update order status.");
    }

    const order = await ctx.db.get(orderId);
    if (!order) throw new Error("Order not found.");
    await ctx.db.patch(orderId, { status });
    if (order.userId !== identity) {
      await ctx.db.insert("notifications", {
        userId: order.userId,
        title: "Order status updated",
        message: `Order ${orderId.slice(-6).toUpperCase()} is now ${status}.`,
        kind: "order",
        read: false,
        createdAt: Date.now(),
      });
    }
    return orderId;
  },
});

export const byId = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const userId = await getUserId(ctx);
    const order = await ctx.db.get(orderId);
    if (!order || order.userId !== userId) return null;
    return order;
  },
});
