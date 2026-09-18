import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/access";
import { isLiveOrder } from "./lib/orders";

const orderStatus = v.optional(v.union(v.literal("pending"), v.literal("confirmed"), v.literal("processing"), v.literal("shipped"), v.literal("delivered"), v.literal("cancelled")));
const taskStatus = v.union(v.literal("open"), v.literal("in_progress"), v.literal("done"));
const taskPriority = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const { identity } = await requireProfile(ctx, ["staff"]);
    const [allOrders, products, tasks, messages] = await Promise.all([
      ctx.db.query("orders").withIndex("by_createdAt").collect(),
      ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true)).collect(),
      ctx.db.query("staffTasks").withIndex("by_assignedTo", (q) => q.eq("assignedTo", identity.subject)).collect(),
      ctx.db.query("contactMessages").withIndex("by_status", (q) => q.eq("status", "new")).collect(),
    ]);
    const orders = allOrders.filter(isLiveOrder);
    const queue = orders.filter((order) => ["pending", "confirmed", "processing"].includes(order.status)).sort((a, b) => b.createdAt - a.createdAt);
    const lowStock = products.filter((product) => (product.stock ?? 0) <= 12).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)).slice(0, 5);
    const openTasks = tasks.filter((task) => task.status !== "done").sort((a, b) => Number(b.priority === "high") - Number(a.priority === "high") || (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
    const inventoryUnits = products.reduce((sum, product) => sum + (product.stock ?? 0), 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ordersToday = orders.filter((order) => order.createdAt >= today.getTime() && order.status !== "cancelled").length;

    return {
      stats: {
        ordersInQueue: queue.length,
        awaitingDispatch: queue.filter((order) => order.status === "confirmed" || order.status === "processing").length,
        lowStock: lowStock.length,
        openTasks: openTasks.length,
        ordersToday,
        newMessages: messages.length,
        inventoryUnits,
      },
      queue: queue.slice(0, 6).map((order) => ({
        id: order._id,
        orderNumber: order._id.slice(-6).toUpperCase(),
        customer: order.customerName ?? "Sterling customer",
        itemName: order.items[0]?.name ?? "Jewelry order",
        amountCents: order.subtotalCents,
        status: order.status,
        city: order.shippingCity ?? "—",
        createdAt: order.createdAt,
      })),
      lowStock: lowStock.map((product) => ({
        id: product._id,
        name: product.name,
        category: product.category,
        stock: product.stock ?? 0,
      })),
      tasks: openTasks.slice(0, 5).map((task) => ({
        id: task._id,
        title: task.title,
        detail: task.detail,
        priority: task.priority,
        status: task.status,
        dueAt: task.dueAt,
      })),
    };
  },
});

export const orders = query({
  args: { status: orderStatus },
  handler: async (ctx, { status }) => {
    await requireProfile(ctx, ["staff", "admin"]);
    const orders = status
      ? await ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", status as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled")).collect()
      : await ctx.db.query("orders").withIndex("by_createdAt").collect();
    return orders.filter(isLiveOrder).sort((a, b) => b.createdAt - a.createdAt).map((order) => ({ id: order._id, orderNumber: order._id.slice(-6).toUpperCase(), customer: order.customerName ?? "Sterling customer", email: order.customerEmail ?? "—", itemName: order.items[0]?.name ?? "Jewelry order", itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0), amountCents: order.subtotalCents, city: order.shippingCity ?? "—", status: order.status, createdAt: order.createdAt }));
  },
});

export const products = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, { search }) => {
    await requireProfile(ctx, ["staff", "admin"]);
    const needle = search?.trim().toLowerCase();
    return (await ctx.db.query("products").collect()).filter((product) => !needle || `${product.name} ${product.category} ${product.sku ?? ""}`.toLowerCase().includes(needle)).sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name));
  },
});

export const collections = query({
  args: {},
  handler: async (ctx) => {
    await requireProfile(ctx, ["staff", "admin"]);
    const [collections, products] = await Promise.all([ctx.db.query("collections").collect(), ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true)).collect()]);
    return collections.sort((a, b) => a.sortOrder - b.sortOrder).map((collection) => ({ ...collection, productCount: products.filter((product) => product.collection === collection.name).length, inventoryUnits: products.filter((product) => product.collection === collection.name).reduce((sum, product) => sum + (product.stock ?? 0), 0) }));
  },
});

export const customers = query({
  args: {},
  handler: async (ctx) => {
    await requireProfile(ctx, ["staff", "admin"]);
    const [profiles, allOrders] = await Promise.all([ctx.db.query("profiles").collect(), ctx.db.query("orders").collect()]);
    const orders = allOrders.filter(isLiveOrder);
    return profiles
      .filter((profile) => profile.role === "customer")
      .map((profile) => { const owned = orders.filter((order) => order.userId === profile.userId && order.status !== "cancelled"); return { ...profile, orderCount: owned.length, spendCents: owned.reduce((sum, order) => sum + order.subtotalCents, 0) }; })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const inventory = query({
  args: { alertsOnly: v.optional(v.boolean()) },
  handler: async (ctx, { alertsOnly }) => {
    await requireProfile(ctx, ["staff", "admin"]);
    return (await ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true)).collect()).filter((product) => !alertsOnly || (product.stock ?? 0) <= 12).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
  },
});

export const tasks = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    const { identity, profile } = await requireProfile(ctx, ["staff", "admin"]);
    const rows = profile.role === "admin" ? await ctx.db.query("staffTasks").collect() : await ctx.db.query("staffTasks").withIndex("by_assignedTo", (q) => q.eq("assignedTo", identity.subject)).collect();
    return rows.filter((task) => !status || task.status === status).sort((a, b) => Number(b.priority === "high") - Number(a.priority === "high") || (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
  },
});

export const createTask = mutation({
  args: { title: v.string(), detail: v.string(), type: v.union(v.literal("order"), v.literal("inventory"), v.literal("customer"), v.literal("general")), priority: taskPriority, assignedTo: v.optional(v.string()), dueAt: v.optional(v.number()) },
  handler: async (ctx, task) => {
    const { identity, profile } = await requireProfile(ctx, ["staff", "admin"]);
    if (!task.title.trim()) throw new Error("Task title is required.");
    const assignedTo = profile.role === "staff" ? identity.subject : task.assignedTo?.trim() || identity.subject;
    const now = Date.now();
    return ctx.db.insert("staffTasks", { ...task, title: task.title.trim(), detail: task.detail.trim(), assignedTo, status: "open", createdBy: identity.subject, createdAt: now, updatedAt: now });
  },
});

export const updateTask = mutation({
  args: { taskId: v.id("staffTasks"), status: v.optional(taskStatus), priority: v.optional(taskPriority) },
  handler: async (ctx, { taskId, ...updates }) => {
    const { identity, profile } = await requireProfile(ctx, ["staff", "admin"]);
    const task = await ctx.db.get(taskId);
    if (!task || (profile.role !== "admin" && task.assignedTo !== identity.subject)) throw new Error("Task not found.");
    await ctx.db.patch(taskId, { ...updates, updatedAt: Date.now() });
    return taskId;
  },
});

export const settings = query({
  args: {},
  handler: async (ctx) => {
    const { identity, profile } = await requireProfile(ctx, ["staff"]);
    const settings = await ctx.db.query("staffSettings").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).unique();
    return { profile, settings: settings ?? { shiftLabel: "Client experience", timezone: "Asia/Manila", dailyBriefing: true } };
  },
});

export const saveSettings = mutation({
  args: { shiftLabel: v.string(), timezone: v.string(), dailyBriefing: v.boolean() },
  handler: async (ctx, settings) => {
    const { identity } = await requireProfile(ctx, ["staff"]);
    const existing = await ctx.db.query("staffSettings").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).unique();
    if (existing) await ctx.db.patch(existing._id, { ...settings, shiftLabel: settings.shiftLabel.trim(), timezone: settings.timezone.trim(), updatedAt: Date.now() });
    else await ctx.db.insert("staffSettings", { ...settings, userId: identity.subject, shiftLabel: settings.shiftLabel.trim(), timezone: settings.timezone.trim(), updatedAt: Date.now() });
    return true;
  },
});
