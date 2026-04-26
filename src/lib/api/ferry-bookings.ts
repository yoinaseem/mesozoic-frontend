import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { FerryBooking, FerryBookingStatus } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type FerryBookingFilters = {
  status?: FerryBookingStatus;
  ferry_schedule_id?: number;
  ferry_id?: number;
  reservation_id?: number;
  travel_date?: string;
  page?: number;
};

function buildQuery(filters: FerryBookingFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.ferry_schedule_id != null) {
    params.set("ferry_schedule_id", String(filters.ferry_schedule_id));
  }
  if (filters.ferry_id != null) {
    params.set("ferry_id", String(filters.ferry_id));
  }
  if (filters.reservation_id != null) {
    params.set("reservation_id", String(filters.reservation_id));
  }
  if (filters.travel_date) params.set("travel_date", filters.travel_date);
  if (filters.page != null) params.set("page", String(filters.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listFerryBookings(filters: FerryBookingFilters = {}) {
  return apiRequest<Paginated<FerryBooking>>(
    `/ferry-bookings${buildQuery(filters)}`,
  );
}

export async function getFerryBooking(bookingId: number) {
  return apiRequest<DataEnvelope<FerryBooking>>(
    `/ferry-bookings/${bookingId}`,
  );
}

// PATCH accepts only status + guests. Schedule and travel_date are NOT
// swappable per §15 — cancel and rebook to change either. cancelled→confirmed
// is rejected with `422 errors.status` (DESD-100 status-transition guard).
export type FerryBookingUpdateInput = {
  status?: FerryBookingStatus;
  guests?: number;
};

export async function updateFerryBooking(
  bookingId: number,
  input: FerryBookingUpdateInput,
) {
  return apiRequest<DataEnvelope<FerryBooking>>(
    `/ferry-bookings/${bookingId}`,
    { method: "PATCH", body: input },
  );
}

export async function cancelFerryBooking(bookingId: number) {
  return apiRequest<null>(`/ferry-bookings/${bookingId}`, { method: "DELETE" });
}
