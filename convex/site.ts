import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireProfile } from "./lib/access";

const messageStatus = v.union(v.literal("new"), v.literal("read"), v.literal("replied"), v.literal("archived"));

export const defaultContent = {
  key: "site",
  aboutEyebrow: "The SterlingMart point of view",
  aboutTitle: "Jewelry with a longer view.",
  aboutIntro: "We choose modern heirlooms for the way you actually live: luminous, considered, and made to gather meaning over time.",
  aboutBody: "SterlingMart began with a simple belief: the best jewelry does more than complete a look. It becomes part of the story. Our edit brings together fine gold, diamonds, pearls, and colored stones from studios that care about proportion, craft, and the quiet details you notice years later.",
  aboutValues: [
    { title: "Considered by hand", detail: "Every piece earns its place through material, proportion, and the feeling it leaves when worn." },
    { title: "Made for the moment", detail: "From first milestones to everyday rituals, our edit is chosen to live beyond a single occasion." },
    { title: "A brighter tomorrow", detail: "We favor thoughtful materials, transparent studio partners, and pieces worth keeping." },
  ],
  contactEyebrow: "The SterlingMart salon",
  contactTitle: "Let’s find your next heirloom.",
  contactIntro: "Tell us what you’re looking for. Our team can help with a piece, a gift, or a private appointment.",
  contactEmail: "hello@sterlingmart.com",
  contactPhone: "+63 917 800 0142",
  contactAddress: "14 Legaspi Village, Makati City, Philippines",
  contactHours: "Monday–Saturday · 10:00–18:00 PHT",
  updatedAt: 0,
};

function clean(value: string, label: string, maxLength: number) {
  const result = value.trim();
  if (!result) throw new Error(`${label} is required.`);
  if (result.length > maxLength) throw new Error(`${label} is too long.`);
  return result;
}

export const content = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("siteContent").withIndex("by_key", (q) => q.eq("key", "site")).unique();
    return row ?? defaultContent;
  },
});

export const saveContent = mutation({
  args: {
    aboutEyebrow: v.string(),
    aboutTitle: v.string(),
    aboutIntro: v.string(),
    aboutBody: v.string(),
    aboutValues: v.array(v.object({ title: v.string(), detail: v.string() })),
    contactEyebrow: v.string(),
    contactTitle: v.string(),
    contactIntro: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    contactAddress: v.string(),
    contactHours: v.string(),
  },
  handler: async (ctx, values) => {
    const { identity } = await requireProfile(ctx, ["admin"]);
    if (values.aboutValues.length !== 3) throw new Error("Add exactly three brand values.");
    const now = Date.now();
    const cleanValues = {
      key: "site" as const,
      aboutEyebrow: clean(values.aboutEyebrow, "About eyebrow", 80),
      aboutTitle: clean(values.aboutTitle, "About title", 120),
      aboutIntro: clean(values.aboutIntro, "About introduction", 320),
      aboutBody: clean(values.aboutBody, "About story", 1200),
      aboutValues: values.aboutValues.map((item) => ({ title: clean(item.title, "Value title", 80), detail: clean(item.detail, "Value detail", 240) })),
      contactEyebrow: clean(values.contactEyebrow, "Contact eyebrow", 80),
      contactTitle: clean(values.contactTitle, "Contact title", 120),
      contactIntro: clean(values.contactIntro, "Contact introduction", 320),
      contactEmail: clean(values.contactEmail, "Contact email", 160),
      contactPhone: clean(values.contactPhone, "Contact phone", 80),
      contactAddress: clean(values.contactAddress, "Contact address", 200),
      contactHours: clean(values.contactHours, "Contact hours", 120),
      updatedBy: identity.subject,
      updatedAt: now,
    };
    const existing = await ctx.db.query("siteContent").withIndex("by_key", (q) => q.eq("key", "site")).unique();
    if (existing) await ctx.db.patch(existing._id, cleanValues);
    else await ctx.db.insert("siteContent", cleanValues);
    return true;
  },
});

export const submitMessage = mutation({
  args: { name: v.string(), email: v.string(), subject: v.string(), message: v.string() },
  handler: async (ctx, values) => {
    const identity = await ctx.auth.getUserIdentity();
    const name = clean(values.name, "Name", 100);
    const email = clean(values.email, "Email", 160);
    const subject = clean(values.subject, "Subject", 160);
    const message = clean(values.message, "Message", 2000);
    if (!email.includes("@")) throw new Error("Enter a valid email address.");
    const now = Date.now();
    return ctx.db.insert("contactMessages", { name, email, subject, message, status: "new", userId: identity?.subject, createdAt: now, updatedAt: now });
  },
});

export const messages = query({
  args: { status: v.optional(messageStatus) },
  handler: async (ctx, { status }) => {
    await requireProfile(ctx, ["admin"]);
    const rows = status
      ? await ctx.db.query("contactMessages").withIndex("by_status", (q) => q.eq("status", status)).collect()
      : await ctx.db.query("contactMessages").withIndex("by_createdAt").collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const updateMessageStatus = mutation({
  args: { messageId: v.id("contactMessages"), status: messageStatus },
  handler: async (ctx, { messageId, status }) => {
    await requireProfile(ctx, ["admin"]);
    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found.");
    await ctx.db.patch(messageId, { status, updatedAt: Date.now() });
    return messageId;
  },
});
