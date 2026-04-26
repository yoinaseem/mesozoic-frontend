import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { BeachBooking, BeachBookingStatus } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type BeachBookingFilters = {
  status?: BeachBookingStatus;
  beach_activity_id?: number;
  beach_activity_schedule_id?: number;
  reservation_id?: number;
  date?: string;
  page?: number;
};

function buildQuery(filters: BeachBookingFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.beach_activity_id != null) {
    params.set("beach_activity_id", String(filters.beach_activity_id));
  }
  if (filters.beach_activity_schedule_id != null) {
    params.set(
      "beach_activity_schedule_id",
      String(filters.beach_activity_schedule_id),
    );
  }
  if (filters.reservation_id != null) {
    params.set("reservation_id", String(filters.reservation_id));
  }
  if (filters.date) params.set("date", filters.date);
  if (filters.page != null) params.set("page", String(filters.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listBeachBookings(filters: BeachBookingFilters = {}) {
  return apiRequest<Paginated<BeachBooking>>(
    `/beach-bookings${buildQuery(filters)}`,
  );
}

export async function getBeachBooking(bookingId: number) {
  return apiRequest<DataEnvelope<BeachBooking>>(
    `/beach-bookings/${bookingId}`,
  );
}

export type BeachBookingUpdateInput = {
  // DESD-97 hotfix: reconfirming a cancelled row is allowed and clears
  // `cancelled_at` server-side. If another confirmed booking holds the same
  // (reservation, schedule) slot the response is `422 errors.status` rather
  // than a 500 — UI should surface the message and prompt the operator to
  // cancel the rebook first.
  status?: BeachBookingStatus;
  guests?: number;
};

export async function updateBeachBooking(
  bookingId: number,
  input: BeachBookingUpdateInput,
) {
  return apiRequest<DataEnvelope<BeachBooking>>(
    `/beach-bookings/${bookingId}`,
    { method: "PATCH", body: input },
  );
}

export async function cancelBeachBooking(bookingId: number) {
  return apiRequest<null>(`/beach-bookings/${bookingId}`, { method: "DELETE" });
}
