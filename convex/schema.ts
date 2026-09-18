import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { roleValidator } from "./lib/roles";

export default defineSchema({
  products: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    collection: v.optional(v.string()),
    sku: v.optional(v.string()),
    material: v.optional(v.string()),
    gemstone: v.optional(v.string()),
    priceCents: v.number(),
    imageUrl: v.string(),
    accent: v.string(),
    stock: v.optional(v.number()),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    vendorName: v.optional(v.string()),
    vendorUserId: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"])
    .index("by_category", ["category"])
    .index("by_collection", ["collection"])
    .index("by_vendorUserId", ["vendorUserId"]),

  collections: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    accent: v.string(),
    heroImageUrl: v.optional(v.string()),
    isActive: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  siteContent: defineTable({
    key: v.string(),
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
    updatedBy: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    status: v.union(v.literal("new"), v.literal("read"), v.literal("replied"), v.literal("archived")),
    userId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_userId", ["userId"]),

  campaigns: defineTable({
    name: v.string(),
    channel: v.union(v.literal("storefront"), v.literal("email"), v.literal("social")),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("live"), v.literal("ended")),
    headline: v.string(),
    description: v.string(),
    collectionSlug: v.optional(v.string()),
    budgetCents: v.number(),
    startsAt: v.number(),
    endsAt: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_createdBy", ["createdBy"]),

  profiles: defineTable({
    userId: v.string(),
    email: v.string(),
    displayName: v.string(),
    role: roleValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  carts: defineTable({
    userId: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
    ),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  customerAddresses: defineTable({
    userId: v.string(),
    label: v.string(),
    recipient: v.string(),
    line1: v.string(),
    city: v.string(),
    postalCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  customerPreferences: defineTable({
    userId: v.string(),
    emailUpdates: v.boolean(),
    smsUpdates: v.boolean(),
    styleProfile: v.string(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  staffTasks: defineTable({
    title: v.string(),
    detail: v.string(),
    type: v.union(v.literal("order"), v.literal("inventory"), v.literal("customer"), v.literal("general")),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("done")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    assignedTo: v.string(),
    relatedOrderId: v.optional(v.id("orders")),
    dueAt: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_assignedTo", ["assignedTo"])
    .index("by_status", ["status"]),

  staffSettings: defineTable({
    userId: v.string(),
    shiftLabel: v.string(),
    timezone: v.string(),
    dailyBriefing: v.boolean(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  vendorProfiles: defineTable({
    userId: v.string(),
    brandName: v.string(),
    contactEmail: v.string(),
    phone: v.string(),
    bio: v.string(),
    approvalStatus: v.union(v.literal("pending"), v.literal("approved"), v.literal("paused")),
    updatedAt: v.number(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  analyticsSnapshots: defineTable({
    scope: v.union(v.literal("store"), v.literal("customer"), v.literal("vendor"), v.literal("staff")),
    ownerId: v.optional(v.string()),
    period: v.string(),
    revenueCents: v.number(),
    orderCount: v.number(),
    averageOrderValueCents: v.number(),
    inventoryUnits: v.number(),
    lowStock: v.number(),
    capturedAt: v.number(),
  })
    .index("by_scope", ["scope"])
    .index("by_owner", ["ownerId"])
    .index("by_scope_owner", ["scope", "ownerId"]),

  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    kind: v.union(v.literal("order"), v.literal("inventory"), v.literal("account"), v.literal("system")),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  workspaceSettings: defineTable({
    key: v.string(),
    storeName: v.string(),
    supportEmail: v.string(),
    adminEmail: v.string(),
    currency: v.string(),
    lowStockThreshold: v.number(),
    updatedBy: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  orders: defineTable({
    userId: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        priceCents: v.number(),
        quantity: v.number(),
      }),
    ),
    subtotalCents: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
    customerName: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    shippingCity: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    demoKey: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  favorites: defineTable({
    userId: v.string(),
    productId: v.id("products"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_product", ["userId", "productId"]),
});
