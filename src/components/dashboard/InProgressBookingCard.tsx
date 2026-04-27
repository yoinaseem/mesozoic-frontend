"use client";

import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import {
  clearCart,
  hasStagedItems,
  loadCart,
  type StoredCartPayload,
} from "@/lib/cart-storage";

// Reads the persisted cart directly from localStorage (the customer
// dashboard isn't wrapped in BookingCartProvider). The widget is a
// read-only summary plus two actions: continue → /book, or discard.
export function InProgressBookingCard() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [snapshot, setSnapshot] = useState<StoredCartPayload | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Re-read on focus so a successful checkout in another tab clears this
  // card without a full page refresh.
  useEffect(() => {
    if (userId === null) return;
    const refresh = () => setSnapshot(loadCart(userId));
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [userId]);

  if (userId === null || snapshot === null || !hasStagedItems(snapshot)) {
    return null;
  }

  const { cart } = snapshot;
  const newRooms = cart.rooms.filter((r) => r.existingId === undefined);
  const stagedCount =
    newRooms.length +
    (cart.ferry ? 1 : 0) +
    (cart.parkTicket ? 1 : 0) +
    (cart.parkActivity ? 1 : 0) +
    (cart.beachActivity ? 1 : 0);

  // Pull a friendly title from whatever's in the cart. Prefer the
  // primary new room, fall back to the first ticket type with a name.
  const title = (() => {
    if (newRooms.length > 0) {
      const r = newRooms[0];
      return `${r.hotel.name} · ${r.roomType.name}`;
    }
    if (cart.parkTicket) return `${cart.parkTicket.park.name} · day pass`;
    if (cart.beachActivity) return cart.beachActivity.activity.name;
    if (cart.parkActivity) return cart.parkActivity.activity.name;
    if (cart.ferry) return `${cart.ferry.ferry.name} · ferry`;
    return "Trip in progress";
  })();

  const dateRange = (() => {
    if (newRooms.length === 0) return null;
    let checkIn = newRooms[0].checkIn;
    let checkOut = newRooms[0].checkOut;
    for (const r of newRooms) {
      if (r.checkIn < checkIn) checkIn = r.checkIn;
      if (r.checkOut > checkOut) checkOut = r.checkOut;
    }
    return `${checkIn} → ${checkOut}`;
  })();

  const handleDiscard = () => {
    clearCart(userId);
    setSnapshot(null);
    setShowDiscardDialog(false);
  };

  return (
    <section className="border-primary/30 bg-primary/5 flex flex-col gap-4 rounded-xl border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <ShoppingBag className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-muted text-xs font-semibold uppercase tracking-wider">
            Booking in progress
          </p>
          <h3 className="text-primary mt-1 text-base font-bold">{title}</h3>
          <p className="text-muted mt-1 text-xs">
            {stagedCount} item{stagedCount === 1 ? "" : "s"} in your cart
            {dateRange ? ` · ${dateRange}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <button
          type="button"
          className="border-base hover:border-danger text-muted hover:text-danger inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
          onClick={() => setShowDiscardDialog(true)}
        >
          <Trash2 className="size-3.5" aria-hidden />
          Discard
        </button>
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2 text-sm"
          onClick={() => router.push("/book")}
        >
          Continue booking
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>

      <Dialog
        open={showDiscardDialog}
        onOpenChange={(next) => (next ? null : setShowDiscardDialog(false))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard your in-progress booking?</DialogTitle>
            <DialogDescription>
              This will permanently clear the {stagedCount} item
              {stagedCount === 1 ? "" : "s"} you&rsquo;ve added. You can&rsquo;t
              undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="border-base text-base-color hover:bg-base/40 rounded-lg border px-4 py-2 text-sm font-semibold"
              onClick={() => setShowDiscardDialog(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-danger inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              onClick={handleDiscard}
            >
              <Trash2 className="size-4" aria-hidden />
              Discard
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
