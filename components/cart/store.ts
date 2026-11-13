"use client";

import { useSyncExternalStore } from "react";
import { getProduct, type Product } from "@/lib/products";

export interface CartLine {
  /** slug + size, e.g. "tuxedo-shawl:40R". */
  key: string;
  slug: string;
  size: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  open: boolean;
  /** The last line removed, kept so the customer can undo. */
  removed: CartLine | null;
  /** Message for the polite live region. */
  announcement: string;
}

const STORAGE_KEY = "men-exclusives:bag";
const MAX_QTY = 9;
const EMPTY: CartState = { lines: [], open: false, removed: null, announcement: "" };

let state: CartState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    const lines = parsed.filter(
      (l): l is CartLine =>
        typeof l?.key === "string" &&
        typeof l?.slug === "string" &&
        typeof l?.size === "string" &&
        Number.isInteger(l?.qty) &&
        l.qty > 0 &&
        Boolean(getProduct(l.slug)),
    );
    state = { ...state, lines };
  } catch {
    // unreadable storage: start with an empty bag
  }
}

function set(next: Partial<CartState>, persist = true) {
  state = { ...state, ...next };
  if (persist && next.lines) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // storage full or blocked: the bag still works for this visit
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    load();
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (!loaded) load();
  return state;
}

const getServerSnapshot = () => EMPTY;

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const cart = {
  add(product: Product, size: string) {
    const key = `${product.slug}:${size}`;
    const existing = state.lines.find((l) => l.key === key);
    const lines = existing
      ? state.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l))
      : [...state.lines, { key, slug: product.slug, size, qty: 1 }];
    set({ lines, open: true, removed: null, announcement: `Added ${product.name}, size ${size}, to your bag.` });
  },
  setQty(key: string, qty: number) {
    const clamped = Math.max(1, Math.min(MAX_QTY, qty));
    set({
      lines: state.lines.map((l) => (l.key === key ? { ...l, qty: clamped } : l)),
      announcement: `Quantity set to ${clamped}.`,
    });
  },
  remove(key: string) {
    const removed = state.lines.find((l) => l.key === key) ?? null;
    const name = removed ? getProduct(removed.slug)?.name : undefined;
    set({
      lines: state.lines.filter((l) => l.key !== key),
      removed,
      announcement: name ? `Removed ${name} from your bag.` : "",
    });
  },
  undoRemove() {
    if (!state.removed) return;
    const restored = state.removed;
    set({ lines: [...state.lines, restored], removed: null, announcement: "Put back in your bag." });
  },
  dismissRemoved() {
    set({ removed: null }, false);
  },
  open() {
    set({ open: true }, false);
  },
  close() {
    set({ open: false, removed: null }, false);
  },
  maxQty: MAX_QTY,
};

export function cartCount(lines: CartLine[]) {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + (getProduct(l.slug)?.price ?? 0) * l.qty, 0);
}
