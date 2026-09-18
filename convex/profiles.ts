import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";

const configuredAdminEmail = () =>
  (process.env.STERLINGMART_ADMIN_EMAIL ?? "sumilangmj@gmail.com").trim().toLowerCase();

const getIdentity = async (ctx: Pick<QueryCtx, "auth">) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("You must be signed in.");
  }
  return identity;
};

export const ensureCurrent = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await getIdentity(ctx);
    const now = Date.now();
    const email = (identity.email ?? "").trim().toLowerCase();
    const displayName =
      identity.name ?? identity.nickname ?? email.split("@")[0] ?? "SterlingMart shopper";
    const shouldBeAdmin = email === configuredAdminEmail();
    const current = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!current) {
      const profileId = await ctx.db.insert("profiles", {
        userId: identity.subject,
        email,
        displayName,
        role: shouldBeAdmin ? "admin" : "customer",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("notifications", {
        userId: identity.subject,
        title: shouldBeAdmin ? "Admin workspace ready" : "Welcome to SterlingMart",
        message: shouldBeAdmin ? "Your admin workspace is connected to the live catalog and order data." : "Your customer dashboard is ready for saved pieces, orders, and preferences.",
        kind: "account",
        read: false,
        createdAt: now,
      });
      return profileId;
    }

    if (shouldBeAdmin && current.role !== "admin") {
      await ctx.db.patch(current._id, { role: "admin", email, displayName, updatedAt: now });
    } else if (current.email !== email || current.displayName !== displayName) {
      await ctx.db.patch(current._id, { email, displayName, updatedAt: now });
    }

    return current._id;
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});

export const setRole = mutation({
  args: {
    userId: v.string(),
    role: v.union(
      v.literal("customer"),
      v.literal("staff"),
      v.literal("vendor"),
      v.literal("admin"),
    ),
  },
  handler: async (ctx, { userId, role }) => {
    const identity = await getIdentity(ctx);
    const caller = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (caller?.role !== "admin") {
      throw new Error("Only an admin can assign roles.");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found.");
    if (profile.email.trim().toLowerCase() === configuredAdminEmail() && role !== "admin") {
      throw new Error("The configured administrator must retain admin access.");
    }
    if (profile.role === "admin" && role !== "admin") {
      const adminCount = (await ctx.db.query("profiles").collect()).filter((candidate) => candidate.role === "admin").length;
      if (adminCount <= 1) throw new Error("At least one administrator must remain assigned.");
    }
    await ctx.db.patch(profile._id, { role, updatedAt: Date.now() });
    return profile._id;
  },
});
