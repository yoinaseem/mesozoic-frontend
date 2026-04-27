// Persistent cart storage for the customer booking flow.
//
// Stored under localStorage key `mesozoic.cart.<userId>` so logging out /
// switching users keeps each cart isolated. A 72-hour TTL (since the last
// update) prevents stale references from accumulating — a cart referencing
// a hotel that's since been archived would 422 on submit, so we expire it
// before that becomes a problem.
//
// The blob is schema-versioned. Any version mismatch, malformed JSON, or
// expired record is silently discarded — the customer just gets a clean
// cart, which is fine because cart contents are advisory until checkout.

import type { BookingCart, BookingStep } from "@/types/booking";

const STORAGE_PREFIX = "mesozoic.cart.";
// v2: parkTicket/parkActivity/beachActivity flipped from single nullable
// slots to plural arrays. v3: same flip for ferry → ferries[]. Each
// schema bump just discards stale carts (loadCart returns null on
// version mismatch) so the customer starts fresh — no migration code.
const SCHEMA_VERSION = 3;
const TTL_MS = 72 * 60 * 60 * 1000;

export type StoredCartPayload = {
  cart: BookingCart;
  attachToReservationId: number | null;
  roomAlreadyExists: boolean;
  activeStep: BookingStep;
};

type StoredCartEnvelope = StoredCartPayload & {
  version: number;
  userId: number;
  updatedAt: string; // ISO
};

export function cartKey(userId: number): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function safeWindowAccess(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadCart(userId: number): StoredCartPayload | null {
  const storage = safeWindowAccess();
  if (!storage) return null;

  const raw = storage.getItem(cartKey(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredCartEnvelope>;
    if (parsed.version !== SCHEMA_VERSION) return null;
    if (parsed.userId !== userId) return null;
    if (typeof parsed.updatedAt !== "string") return null;

    const age = Date.now() - new Date(parsed.updatedAt).getTime();
    if (Number.isNaN(age) || age > TTL_MS) {
      storage.removeItem(cartKey(userId));
      return null;
    }

    if (
      !parsed.cart ||
      typeof parsed.activeStep !== "string" ||
      typeof parsed.roomAlreadyExists !== "boolean"
    ) {
      return null;
    }

    return {
      cart: parsed.cart,
      attachToReservationId: parsed.attachToReservationId ?? null,
      roomAlreadyExists: parsed.roomAlreadyExists,
      activeStep: parsed.activeStep,
    };
  } catch {
    return null;
  }
}

export function saveCart(userId: number, payload: StoredCartPayload): void {
  const storage = safeWindowAccess();
  if (!storage) return;
  const envelope: StoredCartEnvelope = {
    version: SCHEMA_VERSION,
    userId,
    updatedAt: new Date().toISOString(),
    ...payload,
  };
  try {
    storage.setItem(cartKey(userId), JSON.stringify(envelope));
  } catch {
    // Quota / private-mode failures are non-fatal — submit still works
    // off in-memory cart state, the customer just won't see it persist.
  }
}

export function clearCart(userId: number): void {
  const storage = safeWindowAccess();
  if (!storage) return;
  storage.removeItem(cartKey(userId));
}

// True when the cart has anything the customer would care about resuming —
// staged tickets or freshly-added (non-existingId) rooms. Used by the
// dashboard widget to decide whether to render and by the resume-cart
// guard. Note: a cart anchored on an existing reservation with NO staged
// tickets is treated as "empty" — there's nothing to resume.
export function hasStagedItems(payload: StoredCartPayload): boolean {
  const { cart } = payload;
  if (
    cart.ferries.length > 0 ||
    cart.parkTickets.length > 0 ||
    cart.parkActivities.length > 0 ||
    cart.beachActivities.length > 0
  ) {
    return true;
  }
  return cart.rooms.some((r) => r.existingId === undefined);
}
