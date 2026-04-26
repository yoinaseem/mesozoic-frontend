import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { ParkOpeningDay, ParkOpeningHour } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type ParkOpeningHourInput = {
  day: ParkOpeningDay;
  open_time: string;
  close_time: string;
  // DESD-95: hybrid cascade. "reject" (default) returns 409 with conflict
  // report when the change would invalidate live schedules; "cascade" applies
  // the change and cancels affected schedules + bookings (or re-syncs all-day
  // schedules whose date stays open).
  on_conflict?: "reject" | "cascade";
};

export async function listParkOpeningHours(parkId: number, page = 1) {
  return apiRequest<Paginated<ParkOpeningHour>>(
    `/theme-parks/${parkId}/opening-hours?page=${page}`,
    { skipAuth: true },
  );
}

export async function createParkOpeningHour(
  parkId: number,
  input: ParkOpeningHourInput,
) {
  return apiRequest<DataEnvelope<ParkOpeningHour>>(
    `/theme-parks/${parkId}/opening-hours`,
    { method: "POST", body: input },
  );
}

export async function updateParkOpeningHour(
  parkId: number,
  openingHourId: number,
  input: Partial<ParkOpeningHourInput>,
) {
  return apiRequest<DataEnvelope<ParkOpeningHour>>(
    `/theme-parks/${parkId}/opening-hours/${openingHourId}`,
    { method: "PATCH", body: input },
  );
}

export async function deleteParkOpeningHour(
  parkId: number,
  openingHourId: number,
  onConflict?: "reject" | "cascade",
) {
  const qs = onConflict ? `?on_conflict=${onConflict}` : "";
  return apiRequest<null>(
    `/theme-parks/${parkId}/opening-hours/${openingHourId}${qs}`,
    { method: "DELETE" },
  );
}
