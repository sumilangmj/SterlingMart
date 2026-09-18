import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/access";

const channel = v.union(v.literal("storefront"), v.literal("email"), v.literal("social"));
const status = v.union(v.literal("draft"), v.literal("scheduled"), v.literal("live"), v.literal("ended"));

export const list = query({
  args: { status: v.optional(status) },
  handler: async (ctx, { status: selectedStatus }) => {
    const { identity, profile } = await requireProfile(ctx, ["admin", "staff", "vendor"]);
    const campaigns = profile.role === "vendor"
      ? await ctx.db.query("campaigns").withIndex("by_createdBy", (q) => q.eq("createdBy", identity.subject)).collect()
      : await ctx.db.query("campaigns").withIndex("by_createdAt").collect();
    return campaigns
      .filter((campaign) => !selectedStatus || campaign.status === selectedStatus)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const create = mutation({
  args: { name: v.string(), channel, status, headline: v.string(), description: v.string(), collectionSlug: v.optional(v.string()), budgetCents: v.number(), startsAt: v.number(), endsAt: v.number() },
  handler: async (ctx, campaign) => {
    const { identity } = await requireProfile(ctx, ["admin", "vendor"]);
    if (!campaign.name.trim() || !campaign.headline.trim()) throw new Error("Campaign name and headline are required.");
    if (!Number.isInteger(campaign.budgetCents) || campaign.budgetCents < 0) throw new Error("Campaign budget must be a non-negative whole number.");
    if (!Number.isFinite(campaign.startsAt) || !Number.isFinite(campaign.endsAt)) throw new Error("Campaign dates must be valid timestamps.");
    if (campaign.endsAt <= campaign.startsAt) throw new Error("Campaign end must be after its start.");
    const now = Date.now();
    return ctx.db.insert("campaigns", { ...campaign, name: campaign.name.trim(), headline: campaign.headline.trim(), description: campaign.description.trim(), createdBy: identity.subject, createdAt: now, updatedAt: now });
  },
});

export const updateStatus = mutation({
  args: { campaignId: v.id("campaigns"), status },
  handler: async (ctx, { campaignId, status: nextStatus }) => {
    const { identity, profile } = await requireProfile(ctx, ["admin", "vendor"]);
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) throw new Error("Campaign not found.");
    if (profile.role === "vendor" && campaign.createdBy !== identity.subject) {
      throw new Error("Vendors can only update their own campaigns.");
    }
    await ctx.db.patch(campaignId, { status: nextStatus, updatedAt: Date.now() });
    return campaignId;
  },
});
