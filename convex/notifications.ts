import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getIdentity, requireProfile } from "./lib/access";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getIdentity(ctx);
    return (await ctx.db.query("notifications").withIndex("by_userId", (q) => q.eq("userId", identity.subject)).collect()).sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const identity = await getIdentity(ctx);
    const notification = await ctx.db.get(notificationId);
    if (!notification || notification.userId !== identity.subject) throw new Error("Notification not found.");
    await ctx.db.patch(notificationId, { read: true });
    return notificationId;
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const { identity } = await requireProfile(ctx);
    const notifications = await ctx.db.query("notifications").withIndex("by_user_read", (q) => q.eq("userId", identity.subject).eq("read", false)).collect();
    await Promise.all(notifications.map((notification) => ctx.db.patch(notification._id, { read: true })));
    return notifications.length;
  },
});
