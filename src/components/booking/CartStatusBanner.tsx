"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

import { useBookingCart } from "@/context/booking-cart-context";

// Sticky reminder + checkout shortcut on /book. Renders only when the
// cart has items the customer would lose by walking away — keeps the
// "saved in cart" mental model visible at all times.
export function CartStatusBanner() {
  const router = useRouter();
  const { cart, hasStagedItems } = useBookingCart();
  if (!hasStagedItems) return null;

  const stagedCount =
    cart.rooms.filter((r) => r.existingId === undefined).length +
    (cart.ferry ? 1 : 0) +
    (cart.parkTicket ? 1 : 0) +
    (cart.parkActivity ? 1 : 0) +
    (cart.beachActivity ? 1 : 0);

  return (
    <div className="border-primary/30 bg-primary/5 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <ShoppingBag className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-primary text-sm font-semibold">
            {stagedCount} item{stagedCount === 1 ? "" : "s"} in your cart
          </p>
          <p className="text-muted text-xs">
            Saved on this device for 72 hours. Continue browsing or check out
            now.
          </p>
        </div>
      </div>
      <button
        type="button"
        className="btn-accent text-sm"
        onClick={() => router.push("/book/checkout")}
      >
        Proceed to checkout
      </button>
    </div>
  );
}
