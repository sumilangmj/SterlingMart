import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/access";
import { isLiveOrder } from "./lib/orders";

const orderStatus = v.optional(v.union(v.literal("pending"), v.literal("confirmed"), v.literal("processing"), v.literal("shipped"), v.literal("delivered"), v.literal("cancelled")));

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const { identity, profile } = await requireProfile(ctx, ["customer"]);
    const [allOrders, favorites, cart, products] = await Promise.all([
      ctx.db.query("orders").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).collect(),
      ctx.db.query("favorites").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).collect(),
      ctx.db.query("carts").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).unique(),
      ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true)).collect(),
    ]);
    const orders = allOrders.filter(isLiveOrder);
    const activeOrders = orders.filter((order) => order.status !== "cancelled");
    const spendCents = activeOrders.reduce((sum, order) => sum + order.subtotalCents, 0);
    const favoriteProducts = (await Promise.all(favorites.slice(0, 6).map((favorite) => ctx.db.get(favorite.productId))))
      .filter((product): product is NonNullable<typeof product> => Boolean(product?.isActive));
    const favoriteIds = new Set(favorites.map((favorite) => favorite.productId));
    const curatedPieces = products
      .filter((product) => !favoriteIds.has(product._id))
      .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || a.createdAt - b.createdAt)
      .slice(0, 3);
    const sortedOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt);
    const recentOrders = sortedOrders.slice(0, 4).map((order) => ({
      id: order._id,
      orderNumber: order._id.slice(-6).toUpperCase(),
      itemName: order.items[0]?.name ?? "Jewelry order",
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      amountCents: order.subtotalCents,
      status: order.status,
      createdAt: order.createdAt,
    }));

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const spendTrend = Array.from({ length: 6 }, (_, index) => {
      const start = new Date(now);
      start.setDate(start.getDate() - ((5 - index) * 5 + 4));
      const end = new Date(start);
      end.setDate(end.getDate() + 5);
      return {
        label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        valueCents: activeOrders
          .filter((order) => order.createdAt >= start.getTime() && order.createdAt < end.getTime())
          .reduce((sum, order) => sum + order.subtotalCents, 0),
      };
    });

    return {
      displayName: profile.displayName,
      stats: {
        spendCents,
        orders: orders.length,
        averageOrderValueCents: activeOrders.length ? Math.round(spendCents / activeOrders.length) : 0,
        savedPieces: favorites.length,
        cartItems: cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
        pendingOrders: orders.filter((order) => order.status === "pending").length,
      },
      recentOrders,
      latestOrder: recentOrders[0] ?? null,
      savedPieces: favoriteProducts.map((product) => ({
        id: product._id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
      })),
      curatedPieces: curatedPieces.map((product) => ({
        id: product._id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
      })),
      spendTrend,
    };
  },
});

export const orders = query({
  args: { status: orderStatus },
  handler: async (ctx, { status }) => {
    const { identity } = await requireProfile(ctx, ["customer"]);
    const orders = (status
      ? await ctx.db.query("orders").withIndex("by_user_status", (q) => q.eq("userId", identity.subject).eq("status", status)).collect()
      : await ctx.db.query("orders").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).collect()).filter(isLiveOrder);
    return orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((order) => ({
        id: order._id,
        orderNumber: order._id.slice(-6).toUpperCase(),
        itemName: order.items[0]?.name ?? "Jewelry order",
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        amountCents: order.subtotalCents,
        status: order.status,
        trackingNumber: order.trackingNumber ?? "Not assigned",
        createdAt: order.createdAt,
      }));
  },
});

export const products = query({
  args: { search: v.optional(v.string()), category: v.optional(v.string()) },
  handler: async (ctx, { search, category }) => {
    await requireProfile(ctx, ["customer"]);
    const needle = search?.trim().toLowerCase();
    return (await ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true)).collect())
      .filter((product) => !category || product.category === category)
      .filter((product) => !needle || `${product.name} ${product.category} ${product.collection ?? ""} ${product.material ?? ""}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || a.name.localeCompare(b.name));
  },
});

export const collections = query({
  args: {},
  handler: async (ctx) => {
    await requireProfile(ctx, ["customer"]);
    const [collections, products] = await Promise.all([
      ctx.db.query("collections").withIndex("by_active", (q) => q.eq("isActive", true)).collect(),
      ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true)).collect(),
    ]);
    return collections.sort((a, b) => a.sortOrder - b.sortOrder).map((collection) => ({
      ...collection,
      pieces: products.filter((product) => product.collection === collection.name).slice(0, 4).map((product) => ({ id: product._id, slug: product.slug, name: product.name, imageUrl: product.imageUrl, priceCents: product.priceCents })),
    }));
  },
});

export const savedPieces = query({
  args: {},
  handler: async (ctx) => {
    const { identity } = await requireProfile(ctx, ["customer"]);
    const favorites = await ctx.db.query("favorites").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).collect();
    const products = await Promise.all(favorites.map((favorite) => ctx.db.get(favorite.productId)));
    return favorites.map((favorite, index) => {
      const product = products[index];
      return product ? { favoriteId: favorite._id, savedAt: favorite.createdAt, product } : null;
    }).filter((item): item is NonNullable<typeof item> => Boolean(item)).sort((a, b) => b.savedAt - a.savedAt);
  },
});

export const settings = query({
  args: {},
  handler: async (ctx) => {
    const { identity, profile } = await requireProfile(ctx, ["customer"]);
    const [addresses, preferences] = await Promise.all([
      ctx.db.query("customerAddresses").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).collect(),
      ctx.db.query("customerPreferences").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).unique(),
    ]);
    return { profile, addresses: addresses.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.updatedAt - a.updatedAt), preferences: preferences ?? { emailUpdates: true, smsUpdates: false, styleProfile: "Quiet brilliance" } };
  },
});

export const saveAddress = mutation({
  args: { addressId: v.optional(v.id("customerAddresses")), label: v.string(), recipient: v.string(), line1: v.string(), city: v.string(), postalCode: v.string(), country: v.string(), isDefault: v.boolean() },
  handler: async (ctx, address) => {
    const { identity } = await requireProfile(ctx, ["customer"]);
    if (!address.label.trim() || !address.recipient.trim() || !address.line1.trim() || !address.city.trim() || !address.postalCode.trim()) throw new Error("Complete the required address fields.");
    const now = Date.now();
    const values = { userId: identity.subject, label: address.label.trim(), recipient: address.recipient.trim(), line1: address.line1.trim(), city: address.city.trim(), postalCode: address.postalCode.trim(), country: address.country.trim() || "Philippines", isDefault: address.isDefault, updatedAt: now };
    if (address.isDefault) {
      const existing = await ctx.db.query("customerAddresses").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).collect();
      await Promise.all(existing.filter((item) => item._id !== address.addressId && item.isDefault).map((item) => ctx.db.patch(item._id, { isDefault: false, updatedAt: now })));
    }
    if (address.addressId) {
      const current = await ctx.db.get(address.addressId);
      if (!current || current.userId !== identity.subject) throw new Error("Address not found.");
      await ctx.db.patch(address.addressId, values);
      return address.addressId;
    }
    return ctx.db.insert("customerAddresses", { ...values, createdAt: now });
  },
});

export const removeAddress = mutation({
  args: { addressId: v.id("customerAddresses") },
  handler: async (ctx, { addressId }) => {
    const { identity } = await requireProfile(ctx, ["customer"]);
    const address = await ctx.db.get(addressId);
    if (!address || address.userId !== identity.subject) throw new Error("Address not found.");
    await ctx.db.delete(addressId);
    return addressId;
  },
});

export const savePreferences = mutation({
  args: { emailUpdates: v.boolean(), smsUpdates: v.boolean(), styleProfile: v.string() },
  handler: async (ctx, preferences) => {
    const { identity } = await requireProfile(ctx, ["customer"]);
    const existing = await ctx.db.query("customerPreferences").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).unique();
    if (existing) await ctx.db.patch(existing._id, { ...preferences, styleProfile: preferences.styleProfile.trim(), updatedAt: Date.now() });
    else await ctx.db.insert("customerPreferences", { ...preferences, userId: identity.subject, styleProfile: preferences.styleProfile.trim(), updatedAt: Date.now() });
    return true;
  },
});

export const cancelOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const { identity } = await requireProfile(ctx, ["customer"]);
    const order = await ctx.db.get(orderId);
    if (!order || order.userId !== identity.subject) throw new Error("Order not found.");
    if (order.status !== "pending") throw new Error("Only pending orders can be cancelled.");
    await ctx.db.patch(orderId, { status: "cancelled" });
    await ctx.db.insert("notifications", {
      userId: identity.subject,
      title: "Order cancelled",
      message: `Order ${orderId.slice(-6).toUpperCase()} has been cancelled from your dashboard.`,
      kind: "order",
      read: false,
      createdAt: Date.now(),
    });
    return orderId;
  },
});
