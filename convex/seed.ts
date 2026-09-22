import { mutation } from "./_generated/server";
import { defaultContent } from "./site";

const catalog = [
  {
    slug: "aurum-solitaire-ring",
    name: "Aurum Solitaire Ring",
    description: "A brilliant-cut stone held in a warm 18k gold setting, made for everyday milestones.",
    category: "Rings",
    collection: "The Signature Edit",
    sku: "SM-RG-001",
    material: "18k yellow gold",
    gemstone: "Lab-grown diamond",
    priceCents: 285000,
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85",
    accent: "clay",
    stock: 24,
    rating: 4.9,
    reviewCount: 86,
    featured: true,
    vendorName: "Aurelia Atelier",
  },
  {
    slug: "infinity-gold-necklace",
    name: "Infinity Gold Necklace",
    description: "A fluid interlocking pendant with a quiet shine that layers beautifully or stands alone.",
    category: "Necklaces",
    collection: "Everyday Icons",
    sku: "SM-NK-014",
    material: "14k recycled gold",
    gemstone: "White sapphire",
    priceCents: 142000,
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85",
    accent: "sage",
    stock: 38,
    rating: 4.8,
    reviewCount: 54,
    featured: true,
    vendorName: "Aurelia Atelier",
  },
  {
    slug: "pearl-drop-earrings",
    name: "Pearl Drop Earrings",
    description: "Luminous freshwater pearls suspended from a sculpted gold drop for a softly polished finish.",
    category: "Earrings",
    collection: "The Pearl Room",
    sku: "SM-ER-008",
    material: "14k gold vermeil",
    gemstone: "Freshwater pearl",
    priceCents: 98000,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85",
    accent: "oat",
    stock: 16,
    rating: 4.7,
    reviewCount: 42,
    featured: true,
    vendorName: "Lustre House",
  },
  {
    slug: "aurelia-tennis-bracelet",
    name: "Aurelia Tennis Bracelet",
    description: "A continuous line of brilliant stones, finished with a secure clasp and heirloom proportion.",
    category: "Bracelets",
    collection: "The Signature Edit",
    sku: "SM-BR-021",
    material: "18k gold",
    gemstone: "Lab-grown diamond",
    priceCents: 360000,
    imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1200&q=85",
    accent: "rust",
    stock: 9,
    rating: 5,
    reviewCount: 31,
    featured: true,
    vendorName: "Aurelia Atelier",
  },
  {
    slug: "luna-diamond-pendant",
    name: "Luna Diamond Pendant",
    description: "A single pear-shaped stone on a fine chain, designed to catch the light without asking for it.",
    category: "Pendants",
    collection: "Quiet Brilliance",
    sku: "SM-PD-005",
    material: "18k white gold",
    gemstone: "Diamond",
    priceCents: 218000,
    imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=1200&q=85",
    accent: "ink",
    stock: 13,
    rating: 4.9,
    reviewCount: 27,
    featured: true,
    vendorName: "Lustre House",
  },
  {
    slug: "celeste-signet-ring",
    name: "Celeste Signet Ring",
    description: "A softly squared signet with an engraved star detail and the weight of a future heirloom.",
    category: "Rings",
    collection: "Everyday Icons",
    sku: "SM-RG-019",
    material: "Sterling silver",
    gemstone: "Blue topaz",
    priceCents: 129000,
    imageUrl: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=1200&q=85",
    accent: "sand",
    stock: 7,
    rating: 4.6,
    reviewCount: 19,
    featured: false,
    vendorName: "Northstar Goldsmiths",
  },
  {
    slug: "imperial-curb-chain",
    name: "Imperial Curb Chain",
    description: "A considered chain with generous links, hand-polished edges, and a confident everyday drape.",
    category: "Necklaces",
    collection: "After Dark",
    sku: "SM-NK-031",
    material: "18k gold plated silver",
    gemstone: "None",
    priceCents: 189000,
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=85",
    accent: "clay",
    stock: 22,
    rating: 4.8,
    reviewCount: 36,
    featured: false,
    vendorName: "Northstar Goldsmiths",
  },
  {
    slug: "solstice-hoop-earrings",
    name: "Solstice Hoop Earrings",
    description: "Rounded hoops with a warm polished finish, sized for the first coffee and the last reservation.",
    category: "Earrings",
    collection: "Everyday Icons",
    sku: "SM-ER-012",
    material: "14k gold",
    gemstone: "None",
    priceCents: 76000,
    imageUrl: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=85",
    accent: "sage",
    stock: 48,
    rating: 4.8,
    reviewCount: 74,
    featured: false,
    vendorName: "Lustre House",
  },
  {
    slug: "elan-sapphire-ring",
    name: "Élan Sapphire Ring",
    description: "A deep blue oval sapphire framed by a halo of light for a piece with unmistakable presence.",
    category: "Rings",
    collection: "Quiet Brilliance",
    sku: "SM-RG-027",
    material: "18k white gold",
    gemstone: "Blue sapphire",
    priceCents: 324000,
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=85",
    accent: "rust",
    stock: 5,
    rating: 5,
    reviewCount: 14,
    featured: false,
    vendorName: "Aurelia Atelier",
  },
  {
    slug: "eden-pearl-bracelet",
    name: "Eden Pearl Bracelet",
    description: "A strand of luminous pearls with a signature gold clasp that makes the everyday feel ceremonial.",
    category: "Bracelets",
    collection: "The Pearl Room",
    sku: "SM-BR-010",
    material: "14k gold",
    gemstone: "Freshwater pearl",
    priceCents: 118000,
    imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1200&q=85",
    accent: "oat",
    stock: 18,
    rating: 4.7,
    reviewCount: 24,
    featured: false,
    vendorName: "Lustre House",
  },
  {
    slug: "halo-stud-earrings",
    name: "Halo Stud Earrings",
    description: "Petite round stones surrounded by a fine halo, made for effortless light from day to evening.",
    category: "Earrings",
    collection: "Quiet Brilliance",
    sku: "SM-ER-002",
    material: "14k white gold",
    gemstone: "Lab-grown diamond",
    priceCents: 64000,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85",
    accent: "sand",
    stock: 64,
    rating: 4.9,
    reviewCount: 92,
    featured: false,
    vendorName: "Aurelia Atelier",
  },
  {
    slug: "nocturne-onyx-pendant",
    name: "Nocturne Onyx Pendant",
    description: "A black onyx cabochon in a sculpted gold frame for evenings that deserve a little edge.",
    category: "Pendants",
    collection: "After Dark",
    sku: "SM-PD-018",
    material: "18k gold plated silver",
    gemstone: "Black onyx",
    priceCents: 154000,
    imageUrl: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=85",
    accent: "ink",
    stock: 11,
    rating: 4.7,
    reviewCount: 18,
    featured: false,
    vendorName: "Northstar Goldsmiths",
  },
];

export const seedCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const email = (identity?.email ?? "").trim().toLowerCase();
    const adminEmail = (process.env.STERLINGMART_ADMIN_EMAIL ?? "sumilangmj@gmail.com").trim().toLowerCase();
    if (!identity || email !== adminEmail) throw new Error("Only the configured admin can seed the catalog.");

    const now = Date.now();
    const collectionMeta = [
      { name: "The Signature Edit", slug: "signature-edit", description: "The pieces that define the SterlingMart point of view.", accent: "gold", sortOrder: 1 },
      { name: "Everyday Icons", slug: "everyday-icons", description: "Easy brilliance for the rhythm of every day.", accent: "sage", sortOrder: 2 },
      { name: "Quiet Brilliance", slug: "quiet-brilliance", description: "Considered stones with a little more presence.", accent: "ink", sortOrder: 3 },
      { name: "The Pearl Room", slug: "the-pearl-room", description: "Luminous freshwater pearls, softly finished.", accent: "oat", sortOrder: 4 },
      { name: "After Dark", slug: "after-dark", description: "Polished evening pieces with a confident edge.", accent: "clay", sortOrder: 5 },
    ];
    for (const collection of collectionMeta) {
      const existing = await ctx.db.query("collections").withIndex("by_slug", (q) => q.eq("slug", collection.slug)).unique();
      if (existing) await ctx.db.patch(existing._id, { ...collection, updatedAt: now, isActive: true });
      else await ctx.db.insert("collections", { ...collection, isActive: true, createdAt: now, updatedAt: now });
    }
    const seededSlugs = new Set(catalog.map((item) => item.slug));
    const existingProducts = await ctx.db.query("products").collect();
    for (const product of existingProducts) {
      if (!seededSlugs.has(product.slug) && product.isActive) await ctx.db.patch(product._id, { isActive: false });
    }

    for (const item of catalog) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", item.slug))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { ...item, isActive: true });
      } else {
        await ctx.db.insert("products", { ...item, isActive: true, createdAt: now });
      }
    }

    return { seeded: catalog.length };
  },
});

export const seedWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const email = (identity?.email ?? "").trim().toLowerCase();
    const adminEmail = (process.env.STERLINGMART_ADMIN_EMAIL ?? "sumilangmj@gmail.com").trim().toLowerCase();
    if (!identity || email !== adminEmail) throw new Error("Only the configured admin can seed workspace data.");
    const now = Date.now();
    const campaigns = [
      { name: "Signature Holiday Edit", channel: "storefront" as const, status: "live" as const, headline: "The pieces that stay with you.", description: "A storefront edit built around modern heirlooms and considered gifting.", collectionSlug: "signature-edit", budgetCents: 850000 },
      { name: "The Pearl Room Letter", channel: "email" as const, status: "scheduled" as const, headline: "A softer kind of brilliance.", description: "Introduce the pearl collection with a quiet editorial story.", collectionSlug: "the-pearl-room", budgetCents: 240000 },
      { name: "After Dark Social", channel: "social" as const, status: "draft" as const, headline: "For the plans after sunset.", description: "A social-first concept for sculptural evening pieces.", collectionSlug: "after-dark", budgetCents: 310000 },
    ];
    const existingCampaigns = await ctx.db.query("campaigns").collect();
    for (const campaign of campaigns) {
      if (existingCampaigns.some((item) => item.name === campaign.name)) continue;
      await ctx.db.insert("campaigns", { ...campaign, startsAt: now, endsAt: now + 30 * 86_400_000, createdBy: identity.subject, createdAt: now, updatedAt: now });
    }
    const workspace = await ctx.db.query("workspaceSettings").withIndex("by_key", (q) => q.eq("key", "store")).unique();
    if (!workspace) await ctx.db.insert("workspaceSettings", { key: "store", storeName: "SM Sterling Mart", supportEmail: "hello@sterlingmart.com", adminEmail, currency: "USD", lowStockThreshold: 12, updatedBy: identity.subject, updatedAt: now });
    const siteContent = await ctx.db.query("siteContent").withIndex("by_key", (q) => q.eq("key", "site")).unique();
    if (!siteContent) await ctx.db.insert("siteContent", { ...defaultContent, updatedBy: identity.subject, updatedAt: now });
    const profiles = await ctx.db.query("profiles").collect();
    const notifications = await ctx.db.query("notifications").collect();
    for (const profile of profiles) {
      if (!notifications.some((notification) => notification.userId === profile.userId)) {
        await ctx.db.insert("notifications", { userId: profile.userId, title: "SterlingMart workspace ready", message: profile.role === "admin" ? "Your commerce workspace is connected to the live store data." : `Your ${profile.role} dashboard is ready for the next step.`, kind: "account", read: false, createdAt: now });
      }
      if (profile.role === "customer") {
        const preferences = await ctx.db.query("customerPreferences").withIndex("by_userId", (q) => q.eq("userId", profile.userId)).unique();
        if (!preferences) await ctx.db.insert("customerPreferences", { userId: profile.userId, emailUpdates: true, smsUpdates: false, styleProfile: "Quiet brilliance", updatedAt: now });
      }
      if (profile.role === "staff") {
        const settings = await ctx.db.query("staffSettings").withIndex("by_userId", (q) => q.eq("userId", profile.userId)).unique();
        if (!settings) await ctx.db.insert("staffSettings", { userId: profile.userId, shiftLabel: "Client experience", timezone: "Asia/Manila", dailyBriefing: true, updatedAt: now });
        const tasks = await ctx.db.query("staffTasks").withIndex("by_assignedTo", (q) => q.eq("assignedTo", profile.userId)).collect();
        if (tasks.length === 0) {
          await ctx.db.insert("staffTasks", { title: "Review low-stock pieces", detail: "Check the inventory alerts and confirm the next replenishment handoff.", type: "inventory", status: "open", priority: "high", assignedTo: profile.userId, createdBy: identity.subject, createdAt: now, updatedAt: now });
          await ctx.db.insert("staffTasks", { title: "Prepare delivery follow-up", detail: "Review the latest shipped orders and update any missing customer notes.", type: "order", status: "in_progress", priority: "medium", assignedTo: profile.userId, createdBy: identity.subject, createdAt: now, updatedAt: now });
        }
      }
      if (profile.role === "vendor") {
        const vendor = await ctx.db.query("vendorProfiles").withIndex("by_userId", (q) => q.eq("userId", profile.userId)).unique();
        if (!vendor) await ctx.db.insert("vendorProfiles", { userId: profile.userId, brandName: "Sterling Vendor Studio", contactEmail: profile.email, phone: "", bio: "", approvalStatus: "approved", createdAt: now, updatedAt: now });
      }
    }
    return { campaigns: campaigns.length, settings: true, siteContent: true };
  },
});

export const seedDemoOrders = mutation({
  args: {},
  handler: async () => {
    throw new Error("Demo order seeding is disabled. Create orders through the live customer checkout flow.");
  },
});
