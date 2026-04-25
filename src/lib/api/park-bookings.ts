import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { ParkBooking, ParkBookingStatus } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type ParkBookingFilters = {
  status?: ParkBookingStatus;
  park_id?: number;
  reservation_id?: number;
  date?: string;
  page?: number;
};

function buildQuery(filters: ParkBookingFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.park_id != null) params.set("park_id", String(filters.park_id));
  if (filters.reservation_id != null) {
    params.set("reservation_id", String(filters.reservation_id));
  }
  if (filters.date) params.set("date", filters.date);
  if (filters.page != null) params.set("page", String(filters.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listParkBookings(filters: ParkBookingFilters = {}) {
  return apiRequest<Paginated<ParkBooking>>(
    `/park-bookings${buildQuery(filters)}`,
  );
}

export async function getParkBooking(bookingId: number) {
  return apiRequest<DataEnvelope<ParkBooking>>(`/park-bookings/${bookingId}`);
}

export type ParkBookingUpdateInput = {
  status?: ParkBookingStatus;
  date?: string;
  guests?: number;
};

export async function updateParkBooking(
  bookingId: number,
  input: ParkBookingUpdateInput,
) {
  return apiRequest<DataEnvelope<ParkBooking>>(`/park-bookings/${bookingId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function cancelParkBooking(bookingId: number) {
  return apiRequest<null>(`/park-bookings/${bookingId}`, { method: "DELETE" });
}
