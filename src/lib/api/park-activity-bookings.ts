import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type {
  ParkActivityBooking,
  ParkActivityBookingStatus,
} from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type ParkActivityBookingFilters = {
  status?: ParkActivityBookingStatus;
  park_id?: number;
  park_activity_id?: number;
  park_activity_schedule_id?: number;
  reservation_id?: number;
  date?: string;
  page?: number;
};

function buildQuery(filters: ParkActivityBookingFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.park_id != null) params.set("park_id", String(filters.park_id));
  if (filters.park_activity_id != null) {
    params.set("park_activity_id", String(filters.park_activity_id));
  }
  if (filters.park_activity_schedule_id != null) {
    params.set(
      "park_activity_schedule_id",
      String(filters.park_activity_schedule_id),
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

export async function listParkActivityBookings(
  filters: ParkActivityBookingFilters = {},
) {
  return apiRequest<Paginated<ParkActivityBooking>>(
    `/park-activity-bookings${buildQuery(filters)}`,
  );
}

export async function getParkActivityBooking(bookingId: number) {
  return apiRequest<DataEnvelope<ParkActivityBooking>>(
    `/park-activity-bookings/${bookingId}`,
  );
}

export type ParkActivityBookingUpdateInput = {
  status?: ParkActivityBookingStatus;
  guests?: number;
};

export async function updateParkActivityBooking(
  bookingId: number,
  input: ParkActivityBookingUpdateInput,
) {
  return apiRequest<DataEnvelope<ParkActivityBooking>>(
    `/park-activity-bookings/${bookingId}`,
    { method: "PATCH", body: input },
  );
}

export async function cancelParkActivityBooking(bookingId: number) {
  return apiRequest<null>(`/park-activity-bookings/${bookingId}`, {
    method: "DELETE",
  });
}
