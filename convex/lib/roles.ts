import { v } from "convex/values";

export const roleValidator = v.union(
  v.literal("customer"),
  v.literal("staff"),
  v.literal("vendor"),
  v.literal("admin"),
);

export type Role = "customer" | "staff" | "vendor" | "admin";
