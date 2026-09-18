import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function getIdentity(ctx: Pick<QueryCtx, "auth">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  return identity;
}

export async function getProfile(ctx: QueryCtx | MutationCtx, userId: string) {
  return ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

export async function requireProfile(ctx: QueryCtx | MutationCtx, roles?: string[]) {
  const identity = await getIdentity(ctx);
  const profile = await getProfile(ctx, identity.subject);
  if (!profile) throw new Error("Your SterlingMart profile is not ready yet.");
  if (roles && !roles.includes(profile.role)) throw new Error("You do not have access to this workspace.");
  return { identity, profile };
}

export function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
