import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/access";
import { isLiveOrder } from "./lib/orders";

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: searchTerm }) => {
    const { identity, profile } = await requireProfile(ctx);
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return { products: [], orders: [] };
    const allProducts = await ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true)).collect();
    const products = allProducts
      .filter((product) => profile.role !== "vendor" || !product.vendorUserId || product.vendorUserId === identity.subject)
      .filter((product) => `${product.name} ${product.category} ${product.collection ?? ""} ${product.sku ?? ""}`.toLowerCase().includes(needle))
      .slice(0, 12);
    const visibleProductIds = new Set(allProducts.filter((product) => profile.role !== "vendor" || product.vendorUserId === identity.subject).map((product) => product._id));
    const allOrders = (await ctx.db.query("orders").withIndex("by_createdAt").collect()).filter(isLiveOrder);
    const orders = allOrders
      .filter((order) => profile.role === "customer"
        ? order.userId === identity.subject
        : profile.role === "vendor"
          ? order.items.some((item) => visibleProductIds.has(item.productId))
          : true)
      .filter((order) => `${order._id} ${order.customerName ?? ""} ${order.customerEmail ?? ""} ${order.items.map((item) => item.name).join(" ")}`.toLowerCase().includes(needle))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 12)
      .map((order) => ({ id: order._id, orderNumber: order._id.slice(-6).toUpperCase(), customer: order.customerName ?? "Sterling customer", itemName: order.items[0]?.name ?? "Jewelry order", status: order.status, amountCents: order.subtotalCents, createdAt: order.createdAt }));
    return { products, orders };
  },
});
