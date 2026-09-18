import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/access";
import { isLiveOrder } from "./lib/orders";

const orderStatus = v.optional(v.union(v.literal("pending"), v.literal("confirmed"), v.literal("processing"), v.literal("shipped"), v.literal("delivered"), v.literal("cancelled")));

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const { identity } = await requireProfile(ctx, ["vendor"]);
    const [products, allOrders, vendorProfile] = await Promise.all([
      ctx.db.query("products").withIndex("by_vendorUserId", (q) => q.eq("vendorUserId", identity.subject)).collect(),
      ctx.db.query("orders").withIndex("by_createdAt").collect(),
      ctx.db.query("vendorProfiles").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).unique(),
    ]);
    const productIds = new Set(products.map((product) => product._id));
    const relevantOrders = allOrders.filter(isLiveOrder).filter((order) => order.items.some((item) => productIds.has(item.productId)));
    const activeOrders = relevantOrders.filter((order) => order.status !== "cancelled");
    const lowStock = products.filter((product) => (product.stock ?? 0) <= 12).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)).slice(0, 5);
    const unitsSold = new Map<string, number>();
    let grossSalesCents = 0;
    for (const order of activeOrders) {
      for (const item of order.items) {
        if (!productIds.has(item.productId)) continue;
        unitsSold.set(item.productId, (unitsSold.get(item.productId) ?? 0) + item.quantity);
        grossSalesCents += item.priceCents * item.quantity;
      }
    }
    const topPieces = [...products]
      .sort((a, b) => (unitsSold.get(b._id) ?? 0) - (unitsSold.get(a._id) ?? 0) || Number(b.featured ?? false) - Number(a.featured ?? false))
      .slice(0, 4);
    const queue = relevantOrders.filter((order) => ["pending", "confirmed", "processing"].includes(order.status)).slice(0, 5);

    return {
      profile: vendorProfile ? { brandName: vendorProfile.brandName, approvalStatus: vendorProfile.approvalStatus } : null,
      stats: {
        catalogPieces: products.length,
        inventoryUnits: products.reduce((sum, product) => sum + (product.stock ?? 0), 0),
        unitsSold: [...unitsSold.values()].reduce((sum, value) => sum + value, 0),
        grossSalesCents,
        openOrders: relevantOrders.filter((order) => order.status !== "delivered" && order.status !== "cancelled").length,
        lowStock: lowStock.length,
      },
      topPieces: topPieces.map((product) => ({
        id: product._id,
        slug: product.slug,
        name: product.name,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock ?? 0,
        unitsSold: unitsSold.get(product._id) ?? 0,
      })),
      queue: queue.map((order) => ({
        id: order._id,
        orderNumber: order._id.slice(-6).toUpperCase(),
        customer: order.customerName ?? "Sterling customer",
        itemName: order.items.find((item) => productIds.has(item.productId))?.name ?? "Catalog piece",
        status: order.status,
        amountCents: order.items.filter((item) => productIds.has(item.productId)).reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
        createdAt: order.createdAt,
      })),
      lowStock: lowStock.map((product) => ({ id: product._id, name: product.name, category: product.category, stock: product.stock ?? 0 })),
    };
  },
});

export const products = query({
  args: { search: v.optional(v.string()), alertsOnly: v.optional(v.boolean()), ownedOnly: v.optional(v.boolean()) },
  handler: async (ctx, { search, alertsOnly, ownedOnly }) => {
    const { identity } = await requireProfile(ctx, ["vendor"]);
    const needle = search?.trim().toLowerCase();
    return (await ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true)).collect())
      .filter((product) => !ownedOnly || product.vendorUserId === identity.subject)
      .filter((product) => !alertsOnly || (product.stock ?? 0) <= 12)
      .filter((product) => !needle || `${product.name} ${product.category} ${product.collection ?? ""} ${product.sku ?? ""}`.toLowerCase().includes(needle))
      .map((product) => ({ ...product, owned: product.vendorUserId === identity.subject, availableToClaim: !product.vendorUserId }))
      .sort((a, b) => Number(b.owned) - Number(a.owned) || (a.stock ?? 0) - (b.stock ?? 0));
  },
});

export const orders = query({
  args: { status: orderStatus },
  handler: async (ctx, { status }) => {
    const { identity } = await requireProfile(ctx, ["vendor"]);
    const products = await ctx.db.query("products").withIndex("by_vendorUserId", (q) => q.eq("vendorUserId", identity.subject)).collect();
    const relevantProducts = new Set(products.filter((product) => product.vendorUserId === identity.subject).map((product) => product._id));
    return (await ctx.db.query("orders").collect()).filter(isLiveOrder).filter((order) => (!status || order.status === status) && order.items.some((item) => relevantProducts.has(item.productId))).sort((a, b) => b.createdAt - a.createdAt).map((order) => ({ id: order._id, orderNumber: order._id.slice(-6).toUpperCase(), customer: order.customerName ?? "Sterling customer", itemName: order.items.find((item) => relevantProducts.has(item.productId))?.name ?? "Jewelry order", itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0), amountCents: order.subtotalCents, status: order.status, createdAt: order.createdAt }));
  },
});

export const collections = query({
  args: {},
  handler: async (ctx) => {
    const { identity } = await requireProfile(ctx, ["vendor"]);
    const [collections, products] = await Promise.all([ctx.db.query("collections").collect(), ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true)).collect()]);
    const ownedProducts = products.filter((product) => product.vendorUserId === identity.subject);
    return collections.sort((a, b) => a.sortOrder - b.sortOrder).map((collection) => ({ ...collection, productCount: ownedProducts.filter((product) => product.collection === collection.name).length, inventoryUnits: ownedProducts.filter((product) => product.collection === collection.name).reduce((sum, product) => sum + (product.stock ?? 0), 0) }));
  },
});

export const profile = query({
  args: {},
  handler: async (ctx) => {
    const { identity } = await requireProfile(ctx, ["vendor"]);
    return ctx.db.query("vendorProfiles").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).unique();
  },
});

export const saveProduct = mutation({
  args: { productId: v.id("products"), stock: v.optional(v.number()), featured: v.optional(v.boolean()) },
  handler: async (ctx, { productId, ...updates }) => {
    const { identity } = await requireProfile(ctx, ["vendor"]);
    if (updates.stock !== undefined && (!Number.isInteger(updates.stock) || updates.stock < 0)) throw new Error("Stock must be a non-negative whole number.");
    const product = await ctx.db.get(productId);
    if (!product || (product.vendorUserId && product.vendorUserId !== identity.subject)) throw new Error("This product is managed by another vendor.");
    await ctx.db.patch(productId, { ...updates, vendorUserId: identity.subject });
    return productId;
  },
});

export const saveProfile = mutation({
  args: { brandName: v.string(), contactEmail: v.string(), phone: v.string(), bio: v.string() },
  handler: async (ctx, values) => {
    const { identity } = await requireProfile(ctx, ["vendor"]);
    if (!values.brandName.trim() || !values.contactEmail.trim()) throw new Error("Brand name and contact email are required.");
    const existing = await ctx.db.query("vendorProfiles").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).unique();
    const clean = { ...values, brandName: values.brandName.trim(), contactEmail: values.contactEmail.trim(), phone: values.phone.trim(), bio: values.bio.trim(), updatedAt: Date.now() };
    if (existing) await ctx.db.patch(existing._id, clean);
    else await ctx.db.insert("vendorProfiles", { ...clean, userId: identity.subject, approvalStatus: "pending", createdAt: Date.now() });
    return true;
  },
});

export const updateOrderStatus = mutation({
  args: { orderId: v.id("orders"), status: v.union(v.literal("processing"), v.literal("shipped")) },
  handler: async (ctx, { orderId, status }) => {
    const { identity } = await requireProfile(ctx, ["vendor"]);
    const order = await ctx.db.get(orderId);
    if (!order) throw new Error("Order not found.");
    const products = await ctx.db.query("products").collect();
    const relevant = new Set(products.filter((product) => product.vendorUserId === identity.subject).map((product) => product._id));
    if (!order.items.some((item) => relevant.has(item.productId))) throw new Error("This order is not assigned to your catalog.");
    await ctx.db.patch(orderId, { status });
    return orderId;
  },
});
