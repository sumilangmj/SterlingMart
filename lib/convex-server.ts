import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function convexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
  return url;
}

export function getPublicConvexClient() {
  return new ConvexHttpClient(convexUrl());
}

export async function getAuthenticatedConvexClient() {
  const { isAuthenticated, userId, getToken } = await auth();
  if (!isAuthenticated || !userId) return null;

  // The linked Clerk instance uses the Convex integration, which adds the
  // `aud: "convex"` claim to the default session token. Requesting the
  // optional `convex` JWT template here fails because no custom template is
  // configured in this development instance.
  const token = await getToken();
  if (!token) return null;

  const client = new ConvexHttpClient(convexUrl());
  client.setAuth(token);
  return { client, userId };
}

export async function getCurrentProfile() {
  const authenticated = await getAuthenticatedConvexClient();
  if (!authenticated) return null;

  await authenticated.client.mutation(api.profiles.ensureCurrent, {});
  return authenticated.client.query(api.profiles.current, {});
}
