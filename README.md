# SterlingMart
SterlingMart is a luxury jewelry marketplace built with Next.js, Clerk, and Convex. The local experience uses a cream-and-gold marble visual system across the storefront, authentication surfaces, and role dashboards.

## Ecommerce foundation

The current local slice includes:

- Public storefront with a Convex-backed jewelry catalog, product detail pages, category filters, search, and a signature edit filter. The admin-only `seedCatalog` mutation is setup tooling; the storefront never renders an in-code product fallback.
- Luxury public navigation with Home, About us, Shop, Contact, and Cart routes sharing the cream-marble/gold visual system.
- Convex-backed About/Contact content with an anonymous contact form, protected admin content editor, and admin message inbox.
- Guest favorites prompt for Clerk sign-in; signed-in users can save pieces to their private edit.
- Anonymous browser cart with signed-in Convex cart persistence and guest-cart merge.
- Clerk sign-in/sign-up routes and protected checkout/dashboard routes.
- Convex-authoritative roles: `customer`, `staff`, `vendor`, and `admin`.
- Furnished role-aware dashboards with live revenue, inventory, order, customer, and saved-piece metrics.
- Admin/vendor catalog controls for low-stock quantities and signature-piece featuring; staff/admin order status controls.
- Convex-backed order requests that revalidate product prices and stock server-side, create a real `pending` order, and clear the cart.

## Dashboard workspaces

Each role has its own protected navigation and route family. Every navigation choice is backed by a dedicated page component and a role-scoped Convex query or mutation:

- Admin: overview, orders, products, collections, customers, inventory, marketing, analytics, settings, notifications, and search.
- Staff: overview, orders, products, collections, customers, inventory, marketing, analytics, tasks, settings, notifications, and search.
- Vendor: overview, orders, products, collections, inventory, marketing, analytics, settings, notifications, and search. Vendor catalog ownership and order visibility are enforced server-side.
- Customer: overview, orders, products, collections, saved pieces, settings, notifications, and search.

The data model stays normalized by business domain rather than duplicating rows for every URL: catalog pages use `products` and `collections`, commerce pages use `orders` and `carts`, customer pages use `favorites`, `customerAddresses`, and `customerPreferences`, staff pages use `staffTasks` and `staffSettings`, vendor pages use `vendorProfiles`, campaign pages use `campaigns`, analytics pages use `analyticsSnapshots`, and all roles use `notifications` and `profiles`. This keeps each page independently queryable while preserving one authoritative record for every business object.

The configured admin email is `sumilangmj@gmail.com`. New users default to `customer`; staff and vendor roles can be assigned manually through the protected `profiles.setRole` Convex mutation. Legacy records tagged `demoKey` are excluded from every order-facing query, and demo-order seeding is disabled. Payment capture, carrier integrations, fulfillment automation, and production deployment still require their external provider credentials; the mobile app never fabricates those records.

## Local service setup

This repository is connected to:

- GitHub: `sumilangmj/SterlingMart`
- Convex: `mj-sumilang/sterlingmart` (development deployment)
- Clerk: `SterlingMart` (development instance)

The local Clerk and Convex environment values are stored in `.env.local`, which is ignored by Git. Copy `.env.example` when setting up another machine.

## Run locally

```bash
npm run dev
```

In a second terminal, use `npx convex dev` when changing Convex functions or schema. The linked development deployment is already configured; `npx convex dev --once --typecheck enable --codegen enable` performs a one-time sync and validation.

Useful commands:

```bash
gh auth status
npx convex dev
clerk whoami
clerk doctor
npm run typecheck
npm run lint
npm run build
```

## Android and iOS apps

SterlingMart uses Capacitor for native Android and iOS apps with a locally bundled mobile-first storefront. The mobile app uses the existing Clerk authentication and Convex commerce backend, so live catalog data, carts, favorites, order requests, account history, and contact messages stay consistent across web and mobile.

`npm run mobile:sync` builds the mobile entrypoint into `public/` and syncs those local assets into Android and iOS. It does not point the native app at the deployed web app. Use `CAPACITOR_DEV_SERVER_URL` only for an explicit LAN development session.

```bash
npm install
npm run mobile:sync
npm run mobile:open:android
npm run mobile:open:ios
```

For local device development, use a LAN address that the phone can reach and allow cleartext traffic only for that development session:

```bash
CAPACITOR_DEV_SERVER_URL=http://192.168.1.10:3000 npm run mobile:sync
```

Android builds require Android Studio and an Android SDK. iOS builds require macOS, Xcode, Swift Package Manager, and a valid Apple signing team. Run `npm run dev -- --hostname 0.0.0.0` in a separate terminal when using a local device server.

The native shells also register the `sterlingmart://` URL scheme. For example, `sterlingmart://products/signature-ring` opens the product route inside the app; wire this scheme into email, push, or campaign links when those channels are connected.
