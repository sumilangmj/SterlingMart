/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as campaigns from "../campaigns.js";
import type * as cart from "../cart.js";
import type * as collections from "../collections.js";
import type * as customer from "../customer.js";
import type * as dashboard from "../dashboard.js";
import type * as favorites from "../favorites.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_orders from "../lib/orders.js";
import type * as lib_roles from "../lib/roles.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as profiles from "../profiles.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as site from "../site.js";
import type * as staff from "../staff.js";
import type * as vendor from "../vendor.js";
import type * as workspace from "../workspace.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  analytics: typeof analytics;
  campaigns: typeof campaigns;
  cart: typeof cart;
  collections: typeof collections;
  customer: typeof customer;
  dashboard: typeof dashboard;
  favorites: typeof favorites;
  "lib/access": typeof lib_access;
  "lib/orders": typeof lib_orders;
  "lib/roles": typeof lib_roles;
  notifications: typeof notifications;
  orders: typeof orders;
  products: typeof products;
  profiles: typeof profiles;
  seed: typeof seed;
  settings: typeof settings;
  site: typeof site;
  staff: typeof staff;
  vendor: typeof vendor;
  workspace: typeof workspace;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
