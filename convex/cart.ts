import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type AuthCtx = Pick<QueryCtx, "auth">;
type CartLine = Doc<"carts">["items"][number];
const MAX_CART_QUANTITY = 99;

const getUserId = async (ctx: AuthCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  return identity.subject as string;
};

const lineValidator = v.object({ productId: v.id("products"), quantity: v.number() });

const getCart = async (ctx: QueryCtx | MutationCtx, userId: string) =>
  ctx.db
    .query("carts")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

const saveCart = async (ctx: MutationCtx, userId: string, items: CartLine[]) => {
  const existing = await getCart(ctx, userId);
  if (existing) {
    await ctx.db.patch(existing._id, { items, updatedAt: Date.now() });
    return existing._id;
  }
  return ctx.db.insert("carts", { userId, items, updatedAt: Date.now() });
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const cart = await getCart(ctx, userId);
    const lines = cart?.items ?? [];
    const products = await Promise.all(lines.map((line) => ctx.db.get(line.productId as Id<"products">)));
    const items = [];

    for (const [index, line] of lines.entries()) {
      const product = products[index];
      if (product?.isActive) {
        items.push({
          productId: product._id,
          slug: product.slug,
          name: product.name,
          category: product.category,
          imageUrl: product.imageUrl,
          priceCents: product.priceCents,
          quantity: line.quantity,
          lineTotalCents: product.priceCents * line.quantity,
        });
      }
    }

    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
    };
  },
});

export const addItem = mutation({
  args: { productId: v.id("products"), quantity: v.optional(v.number()) },
  handler: async (ctx, { productId, quantity = 1 }) => {
    const userId = await getUserId(ctx);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) throw new Error("Quantity must be a whole number between 1 and 99.");
    const product = await ctx.db.get(productId as Id<"products">);
    if (!product?.isActive) throw new Error("This product is unavailable.");
    const cart = await getCart(ctx, userId);
    const items = [...(cart?.items ?? [])];
    const index = items.findIndex((item) => item.productId === productId);
    const nextQuantity = index >= 0 ? items[index].quantity + quantity : quantity;
    if (nextQuantity > MAX_CART_QUANTITY) throw new Error("You can add up to 99 of a product.");
    if (product.stock !== undefined && nextQuantity > product.stock) throw new Error(`${product.name} has only ${product.stock} available.`);
    if (index >= 0) items[index] = { ...items[index], quantity: nextQuantity };
    else items.push({ productId, quantity });
    return saveCart(ctx, userId, items);
  },
});

export const setQuantity = mutation({
  args: { productId: v.id("products"), quantity: v.number() },
  handler: async (ctx, { productId, quantity }) => {
    const userId = await getUserId(ctx);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_CART_QUANTITY) throw new Error("Quantity must be a whole number between 0 and 99.");
    if (quantity > 0) {
      const product = await ctx.db.get(productId as Id<"products">);
      if (!product?.isActive) throw new Error("This product is unavailable.");
      if (product.stock !== undefined && quantity > product.stock) throw new Error(`${product.name} has only ${product.stock} available.`);
    }
    const cart = await getCart(ctx, userId);
    const items = (cart?.items ?? [])
      .map((item) => (item.productId === productId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);
    return saveCart(ctx, userId, items);
  },
});

export const removeItem = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const userId = await getUserId(ctx);
    const cart = await getCart(ctx, userId);
    const items = (cart?.items ?? []).filter((item) => item.productId !== productId);
    return saveCart(ctx, userId, items);
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const cart = await getCart(ctx, userId);
    if (cart) await ctx.db.patch(cart._id, { items: [], updatedAt: Date.now() });
    return true;
  },
});

export const mergeGuest = mutation({
  args: { items: v.array(lineValidator) },
  handler: async (ctx, { items: guestItems }) => {
    const userId = await getUserId(ctx);
    const currentCart = await getCart(ctx, userId);
    const merged = [...(currentCart?.items ?? [])];

    for (const guestItem of guestItems) {
      if (!Number.isInteger(guestItem.quantity) || guestItem.quantity < 1 || guestItem.quantity > MAX_CART_QUANTITY) continue;
      const product = await ctx.db.get(guestItem.productId as Id<"products">);
      if (!product?.isActive) continue;
      const index = merged.findIndex((item) => item.productId === guestItem.productId);
      const requestedQuantity = index >= 0 ? merged[index].quantity + guestItem.quantity : guestItem.quantity;
      const availableQuantity = product.stock === undefined ? requestedQuantity : Math.min(requestedQuantity, product.stock);
      const nextQuantity = Math.min(availableQuantity, MAX_CART_QUANTITY);
      if (nextQuantity < 1) continue;
      if (index >= 0) merged[index] = { ...merged[index], quantity: nextQuantity };
      else merged.push({ ...guestItem, quantity: nextQuantity });
    }

    return saveCart(ctx, userId, merged);
  },
});
