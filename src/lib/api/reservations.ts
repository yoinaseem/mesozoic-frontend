import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { Reservation, ReservationStatus } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type ListReservationsParams = {
  page?: number;
  status?: ReservationStatus;
  hotel_id?: number;
  customer?: string;
  // Half-open `[overlaps_from, overlaps_to)` window. Backend filter (per
  // Chris) returns reservations whose confirmed roomBookings overlap the
  // window: `check_in_date < overlaps_to AND check_out_date > overlaps_from`.
  // Until the backend filter lands, `findReservationsOverlapping` falls back
  // to the same overlap test on the eager-loaded room_bookings client-side.
  overlaps_from?: string;
  overlaps_to?: string;
};

function buildQuery(params: ListReservationsParams): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.status) search.set("status", params.status);
  if (params.hotel_id != null) search.set("hotel_id", String(params.hotel_id));
  if (params.customer) search.set("customer", params.customer);
  if (params.overlaps_from) search.set("overlaps_from", params.overlaps_from);
  if (params.overlaps_to) search.set("overlaps_to", params.overlaps_to);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listReservations(params: ListReservationsParams = {}) {
  return apiRequest<Paginated<Reservation>>(`/reservations${buildQuery(params)}`);
}

export async function getReservation(id: number) {
  return apiRequest<DataEnvelope<Reservation>>(`/reservations/${id}`);
}

// Standard half-open interval overlap: `[aIn, aOut)` overlaps `[bIn, bOut)`
// iff `aIn < bOut && aOut > bIn`. Date strings compare lexicographically
// when in YYYY-MM-DD form.
function overlaps(
  aIn: string,
  aOut: string,
  bIn: string,
  bOut: string,
): boolean {
  return aIn < bOut && aOut > bIn;
}

// Cross-session "is there an existing trip that covers these dates?" lookup.
// Sends the backend filter; client-side filters the page on the same overlap
// rule so it works whether or not the backend filter has shipped.
export async function findReservationsOverlapping(
  checkIn: string,
  checkOut: string,
): Promise<Reservation[]> {
  const page = await listReservations({
    overlaps_from: checkIn,
    overlaps_to: checkOut,
  });

  return page.data.filter((reservation) =>
    (reservation.room_bookings ?? []).some(
      (rb) =>
        rb.status === "confirmed" &&
        overlaps(rb.check_in_date, rb.check_out_date, checkIn, checkOut),
    ),
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Reservations the customer can still add tickets to — at least one
// confirmed room booking with check_out_date today-or-later. Backs the
// "Continue an upcoming trip" surface on /book so users who already booked
// a room don't have to book another just to add ferries / park / beach.
export async function findUpcomingReservations(): Promise<Reservation[]> {
  const today = todayIso();
  const page = await listReservations({});
  return page.data.filter((reservation) =>
    (reservation.room_bookings ?? []).some(
      (rb) => rb.status === "confirmed" && rb.check_out_date >= today,
    ),
  );
}
