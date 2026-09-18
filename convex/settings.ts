import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/access";

const defaults = { key: "store", storeName: "SM Sterling Mart", supportEmail: "hello@sterlingmart.com", adminEmail: "sumilangmj@gmail.com", currency: "USD", lowStockThreshold: 12 };

export const workspace = query({
  args: {},
  handler: async (ctx) => {
    await requireProfile(ctx, ["admin"]);
    return (await ctx.db.query("workspaceSettings").withIndex("by_key", (q) => q.eq("key", "store")).unique()) ?? defaults;
  },
});

export const saveWorkspace = mutation({
  args: { storeName: v.string(), supportEmail: v.string(), adminEmail: v.string(), currency: v.string(), lowStockThreshold: v.number() },
  handler: async (ctx, values) => {
    const { identity } = await requireProfile(ctx, ["admin"]);
    if (!values.storeName.trim() || !values.supportEmail.trim() || !values.adminEmail.trim()) throw new Error("Store name and support emails are required.");
    if (!Number.isInteger(values.lowStockThreshold) || values.lowStockThreshold < 0) throw new Error("Low stock threshold must be a non-negative whole number.");
    const clean = { key: "store", storeName: values.storeName.trim(), supportEmail: values.supportEmail.trim(), adminEmail: values.adminEmail.trim(), currency: values.currency.trim() || "USD", lowStockThreshold: values.lowStockThreshold, updatedBy: identity.subject, updatedAt: Date.now() };
    const existing = await ctx.db.query("workspaceSettings").withIndex("by_key", (q) => q.eq("key", "store")).unique();
    if (existing) await ctx.db.patch(existing._id, clean);
    else await ctx.db.insert("workspaceSettings", clean);
    return true;
  },
});
