// Mirror of Reservation::seatPoolOn / ferrySeatPoolOn (API_INTEGRATION.md §10)
// for client-side validation. Sums confirmed room guests covering the given
// date so we can reject ticket guest counts that the API would 422 on.
//
// Exclusive-checkout (default) = park / beach / park-activity, where
// guests are leaving the morning of check-out so that day's pool is 0.
// Inclusive-checkout = ferry, where arrival- and departure-day crossings
// are primary use cases.
//
// Anchored-cart rooms (`existingId !== undefined`) already exist on the
// API and the backend's seatPoolOn accounts for them. They appear in the
// cart with their original guest count, so summing the whole `cart.rooms`
// array gives the same number the backend would compute.

import type { RoomSelection } from "@/types/booking";

export function seatPoolOn(
  rooms: RoomSelection[],
  date: string,
  options: { exclusiveCheckout?: boolean } = {},
): number {
  const exclusiveCheckout = options.exclusiveCheckout ?? true;
  return rooms.reduce((acc, room) => {
    if (room.checkIn > date) return acc;
    if (exclusiveCheckout) {
      if (room.checkOut <= date) return acc;
    } else {
      if (room.checkOut < date) return acc;
    }
    return acc + room.guests;
  }, 0);
}
