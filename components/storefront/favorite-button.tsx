"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { ProductId } from "@/lib/types";

export function FavoriteButton({ productId }: { productId: ProductId }) {
  const { isLoaded, isSignedIn } = useAuth();
  const favoriteIds = useQuery(api.favorites.list, isSignedIn ? {} : "skip");
  const toggle = useMutation(api.favorites.toggle);
  const isSaved = favoriteIds?.some((id) => id === productId) ?? false;

  async function handleToggle() {
    if (!isLoaded || !isSignedIn) return;
    await toggle({ productId });
  }

  const button = (
    <button
      className={`favorite-button${isSaved ? " is-saved" : ""}`}
      type="button"
      aria-label={isSaved ? "Remove from saved pieces" : "Save this piece"}
      aria-pressed={isSaved}
      disabled={!isLoaded}
      onClick={handleToggle}
    >
      <span aria-hidden="true">{isSaved ? "♥" : "♡"}</span>
    </button>
  );

  if (isLoaded && !isSignedIn) {
    return <SignInButton mode="modal" forceRedirectUrl="/dashboard">{button}</SignInButton>;
  }

  return button;
}
