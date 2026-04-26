import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { FerrySchedule } from "@/types/booking";

type DataEnvelope<T> = { data: T };

// DESD-100: slots, not per-trip rows. departure_time + arrival_time live on
// the slot; the date lives on FerryBooking.
export type FerryScheduleInput = {
  ferry_id: number;
  departure_time: string;
  arrival_time: string;
  departure_port: string;
  arrival_port: string;
};

export async function listAllFerrySchedules(page = 1) {
  return apiRequest<Paginated<FerrySchedule>>(`/ferry-schedules?page=${page}`, {
    skipAuth: true,
  });
}

export async function getFerrySchedule(scheduleId: number) {
  return apiRequest<DataEnvelope<FerrySchedule>>(
    `/ferry-schedules/${scheduleId}`,
    { skipAuth: true },
  );
}

// PATCH only on this endpoint (no `ferry_id` swap on update — the slot lives
// under its parent vessel).
export type FerryScheduleUpdateInput = Partial<
  Omit<FerryScheduleInput, "ferry_id">
>;

export async function createFerrySchedule(input: FerryScheduleInput) {
  return apiRequest<DataEnvelope<FerrySchedule>>(`/ferry-schedules`, {
    method: "POST",
    body: input,
  });
}

export async function updateFerrySchedule(
  scheduleId: number,
  input: FerryScheduleUpdateInput,
) {
  return apiRequest<DataEnvelope<FerrySchedule>>(
    `/ferry-schedules/${scheduleId}`,
    { method: "PATCH", body: input },
  );
}

// DESD-100: archive + cascade. Default 409 lists blocking bookings;
// `on_conflict=cascade` cancels them, soft-deletes the slot, and returns
// `200 {cascade: {bookings_cancelled}}`. Empty cascade returns `204`.
export async function deleteFerrySchedule(
  scheduleId: number,
  onConflict?: "reject" | "cascade",
) {
  return apiRequest<unknown>(`/ferry-schedules/${scheduleId}`, {
    method: "DELETE",
    body: onConflict ? { on_conflict: onConflict } : undefined,
  });
}
