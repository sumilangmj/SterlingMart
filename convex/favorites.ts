import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  return identity.subject;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return favorites.map((favorite) => favorite.productId);
  },
});

export const toggle = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_product", (q) => q.eq("userId", userId).eq("productId", productId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }

    await ctx.db.insert("favorites", { userId, productId, createdAt: Date.now() });
    return { saved: true };
  },
});
