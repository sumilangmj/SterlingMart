"use client";

import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartItem, GuestCartItem, Product, ProductId } from "@/lib/types";

const STORAGE_KEY = "sterlingmart-guest-cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  isLoading: boolean;
  addItem: (product: Product) => Promise<void>;
  setQuantity: (productId: ProductId, quantity: number) => Promise<void>;
  removeItem: (productId: ProductId) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function readGuestCart(): GuestCartItem[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is GuestCartItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<GuestCartItem>;
      return (
        typeof candidate.productId === "string" &&
        typeof candidate.quantity === "number" &&
        candidate.quantity > 0 &&
        !!candidate.product &&
        typeof candidate.product.name === "string"
      );
    });
  } catch {
    return [];
  }
}

function toCartItem(item: GuestCartItem): CartItem {
  return {
    productId: item.productId,
    slug: item.product.slug,
    name: item.product.name,
    category: item.product.category,
    imageUrl: item.product.imageUrl,
    priceCents: item.product.priceCents,
    quantity: item.quantity,
    lineTotalCents: item.product.priceCents * item.quantity,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const [guestReady, setGuestReady] = useState(false);
  const lastMergedUser = useRef<string | null>(null);
  const remoteCart = useQuery(api.cart.get, isSignedIn ? {} : "skip");
  const addRemoteItem = useMutation(api.cart.addItem);
  const setRemoteQuantity = useMutation(api.cart.setQuantity);
  const removeRemoteItem = useMutation(api.cart.removeItem);
  const clearRemote = useMutation(api.cart.clear);
  const mergeGuest = useMutation(api.cart.mergeGuest);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setGuestItems(readGuestCart());
      setGuestReady(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (guestReady && !isSignedIn) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guestItems));
    }
  }, [guestItems, guestReady, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      lastMergedUser.current = null;
      return;
    }
    if (!userId || !guestReady || guestItems.length === 0 || lastMergedUser.current === userId) return;

    lastMergedUser.current = userId;
    mergeGuest({ items: guestItems.map(({ productId, quantity }) => ({ productId, quantity })) })
      .then(() => setGuestItems([]))
      .catch(() => {
        lastMergedUser.current = null;
      });
  }, [guestItems, guestReady, isSignedIn, mergeGuest, userId]);

  const addItem = useCallback(
    async (product: Product) => {
      if (isSignedIn) {
        await addRemoteItem({ productId: product._id, quantity: 1 });
        return;
      }

      setGuestItems((current) => {
        const existing = current.find((item) => item.productId === product._id);
        if (existing) {
          return current.map((item) =>
            item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [
          ...current,
          {
            productId: product._id,
            quantity: 1,
            product: {
              slug: product.slug,
              name: product.name,
              category: product.category,
              imageUrl: product.imageUrl,
              priceCents: product.priceCents,
            },
          },
        ];
      });
    },
    [addRemoteItem, isSignedIn],
  );

  const setQuantity = useCallback(
    async (productId: ProductId, quantity: number) => {
      if (isSignedIn) {
        await setRemoteQuantity({ productId, quantity });
        return;
      }
      setGuestItems((current) =>
        current
          .map((item) => (item.productId === productId ? { ...item, quantity } : item))
          .filter((item) => item.quantity > 0),
      );
    },
    [isSignedIn, setRemoteQuantity],
  );

  const removeItem = useCallback(
    async (productId: ProductId) => {
      if (isSignedIn) {
        await removeRemoteItem({ productId });
        return;
      }
      setGuestItems((current) => current.filter((item) => item.productId !== productId));
    },
    [isSignedIn, removeRemoteItem],
  );

  const clear = useCallback(async () => {
    if (isSignedIn) {
      await clearRemote({});
    } else {
      setGuestItems([]);
    }
  }, [clearRemote, isSignedIn]);

  const items = useMemo<CartItem[]>(() => {
    if (isSignedIn) return (remoteCart?.items ?? []) as CartItem[];
    return guestItems.map(toCartItem);
  }, [guestItems, isSignedIn, remoteCart?.items]);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
      isLoading: !isLoaded || (isSignedIn && remoteCart === undefined),
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [addItem, clear, isLoaded, isSignedIn, items, removeItem, setQuantity, remoteCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider.");
  return context;
}
