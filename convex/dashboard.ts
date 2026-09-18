import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { isLiveOrder } from "./lib/orders";

const getIdentity = async (ctx: Pick<QueryCtx, "auth">) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  return identity;
};

const getProfile = async (ctx: QueryCtx | MutationCtx, userId: string) =>
  ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

const canManageCatalog = (role: string | undefined) => role === "admin" || role === "vendor";
const canUpdateInventory = (role: string | undefined) => role === "admin" || role === "staff" || role === "vendor";

async function getDashboardProducts(ctx: QueryCtx, role: string, userId: string) {
  if (role === "vendor") {
    return ctx.db
      .query("products")
      .withIndex("by_vendorUserId", (q) => q.eq("vendorUserId", userId))
      .collect();
  }

  return ctx.db
    .query("products")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .collect();
}

export const overview = query({
  args: {
    range: v.optional(v.union(v.literal("7D"), v.literal("30D"), v.literal("3M"), v.literal("6M"), v.literal("1Y"))),
  },
  handler: async (ctx, { range = "30D" }) => {
    const identity = await getIdentity(ctx);
    const profile = await getProfile(ctx, identity.subject);
    if (!profile) return null;

    const products = (await getDashboardProducts(ctx, profile.role, identity.subject))
      .filter((product) => product.isActive);
    const allOrders = (await ctx.db.query("orders").withIndex("by_createdAt").collect()).filter(isLiveOrder);
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
    const productIds = new Set(products.map((product) => product._id));
    const visibleOrders = profile.role === "customer"
      ? allOrders.filter((order) => order.userId === identity.subject)
      : profile.role === "vendor"
        ? allOrders.filter((order) => order.items.some((item) => productIds.has(item.productId)))
        : allOrders;
    const profiles = profile.role === "admin" || profile.role === "staff"
      ? await ctx.db.query("profiles").collect()
      : [];
    const activeOrders = visibleOrders.filter((order) => order.status !== "cancelled");
    const revenueCents = activeOrders.reduce((sum, order) => sum + order.subtotalCents, 0);
    const inventoryItems = products.reduce((sum, product) => sum + (product.stock ?? 0), 0);
    const customerCount = profile.role === "customer"
      ? 1
      : profile.role === "vendor"
        ? new Set(visibleOrders.map((order) => order.userId)).size
        : profiles.length;
    const categories = new Map<string, number>();
    const unitsSoldByProduct = new Map<string, number>();
    for (const order of visibleOrders) {
      for (const item of order.items) unitsSoldByProduct.set(item.productId, (unitsSoldByProduct.get(item.productId) ?? 0) + item.quantity);
    }
    for (const product of products) categories.set(product.category, (categories.get(product.category) ?? 0) + (product.stock ?? 0));

    const recentOrders = [...visibleOrders]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6)
      .map((order) => ({
        id: order._id,
        orderNumber: order._id.slice(-6).toUpperCase(),
        customer: order.customerName ?? (order.userId === identity.subject ? "You" : "Sterling customer"),
        amountCents: order.subtotalCents,
        status: order.status,
        createdAt: order.createdAt,
        itemName: order.items[0]?.name ?? "Jewelry order",
      }));

    const lowStock = products
      .filter((product) => (product.stock ?? 0) <= 12)
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, 6)
      .map((product) => ({ id: product._id, name: product.name, stock: product.stock ?? 0, category: product.category }));

    const catalogProducts = [...products]
      .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || a.name.localeCompare(b.name))
      .slice(0, 8)
      .map((product) => ({
        id: product._id,
        name: product.name,
        category: product.category,
        stock: product.stock ?? 0,
        featured: product.featured ?? false,
        vendorName: product.vendorName ?? "SterlingMart Atelier",
      }));

    const topPieces = [...products]
      .sort((a, b) => (unitsSoldByProduct.get(b._id) ?? 0) - (unitsSoldByProduct.get(a._id) ?? 0) || Number(b.featured ?? false) - Number(a.featured ?? false) || a.name.localeCompare(b.name))
      .slice(0, 3)
      .map((product) => ({
        id: product._id,
        slug: product.slug,
        name: product.name,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock ?? 0,
        unitsSold: unitsSoldByProduct.get(product._id) ?? 0,
        featured: product.featured ?? false,
      }));

    const customerActivity = [...visibleOrders]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((order) => ({
        id: order._id,
        initials: (order.customerName ?? "SM").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
        customer: order.customerName ?? "Sterling customer",
        action: order.status === "delivered" ? "Order delivered" : order.status === "shipped" ? "Order shipped" : "Placed an order",
        itemName: order.items[0]?.name ?? "Jewelry order",
        createdAt: order.createdAt,
      }));

    const rangeDays = { "7D": 7, "30D": 30, "3M": 90, "6M": 180, "1Y": 365 }[range];
    const bucketSize = Math.ceil(rangeDays / 7);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - (rangeDays - 1));
    const trend = Array.from({ length: 7 }, (_, index) => {
      const bucketStart = new Date(rangeStart);
      bucketStart.setDate(bucketStart.getDate() + Math.min(rangeDays - 1, index * bucketSize));
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + bucketSize);
      const start = bucketStart.getTime();
      const end = Math.min(bucketEnd.getTime(), today.getTime() + 86_400_000);
      return {
        label: range === "7D"
          ? bucketStart.toLocaleDateString("en-US", { weekday: "short" })
          : bucketStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        valueCents: activeOrders
          .filter((order) => order.createdAt >= start && order.createdAt < end)
          .reduce((sum, order) => sum + order.subtotalCents, 0),
      };
    });

    return {
      role: profile.role,
      displayName: profile.displayName,
      stats: {
        revenueCents,
        averageOrderValueCents: activeOrders.length ? Math.round(revenueCents / activeOrders.length) : 0,
        orders: visibleOrders.length,
        customers: customerCount,
        inventoryItems,
        lowStock: lowStock.length,
        featuredProducts: products.filter((product) => product.featured).length,
        savedPieces: favorites.length,
        products: products.length,
        pendingOrders: visibleOrders.filter((order) => order.status === "pending").length,
      },
      inventory: [...categories.entries()].map(([label, value]) => ({ label, value })),
      recentOrders,
      lowStockItems: lowStock,
      catalogProducts,
      topPieces,
      customerActivity,
      trend,
    };
  },
});

export const updateStock = mutation({
  args: { productId: v.id("products"), stock: v.number() },
  handler: async (ctx, { productId, stock }) => {
    const identity = await getIdentity(ctx);
    const profile = await getProfile(ctx, identity.subject);
    if (!canUpdateInventory(profile?.role)) throw new Error("Only admin, staff, or vendor accounts can update inventory.");
    if (!Number.isInteger(stock) || stock < 0) throw new Error("Stock must be a non-negative whole number.");
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found.");
    if (profile.role === "vendor" && product.vendorUserId !== identity.subject) {
      throw new Error("Vendors can only update stock for their own catalog pieces.");
    }
    await ctx.db.patch(productId, { stock });
    return productId;
  },
});

export const toggleFeatured = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const identity = await getIdentity(ctx);
    const profile = await getProfile(ctx, identity.subject);
    if (!canManageCatalog(profile?.role)) throw new Error("Only admin or vendor accounts can feature products.");
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found.");
    if (profile.role === "vendor" && product.vendorUserId !== identity.subject) {
      throw new Error("Vendors can only feature their own catalog pieces.");
    }
    await ctx.db.patch(productId, { featured: !product.featured });
    return !product.featured;
  },
});

export const productDetails = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const identity = await getIdentity(ctx);
    const profile = await getProfile(ctx, identity.subject);
    if (!profile) return null;

    const product = await ctx.db.get(productId);
    if (!product?.isActive) return null;
    if (profile.role === "vendor" && product.vendorUserId !== identity.subject) return null;

    return {
      id: product._id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      collection: product.collection,
      material: product.material,
      gemstone: product.gemstone,
      priceCents: product.priceCents,
      imageUrl: product.imageUrl,
      stock: product.stock ?? 0,
      rating: product.rating,
      reviewCount: product.reviewCount,
      featured: product.featured ?? false,
    };
  },
});
