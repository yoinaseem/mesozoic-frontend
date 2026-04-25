// Helpers for the DESD-95 destructive / hours-cascade response surfaces.
// Three distinct 409 shapes from the park API:
//
//   1. Hours-cascade conflicts (opening-hour + override mutations)
//      { message, conflicts: [{schedule_id, park_activity_id, date,
//        start_time, end_time, confirmed_bookings}], counts: {schedules,
//        bookings} }
//      Resolution: re-POST/PATCH/DELETE with `on_conflict: "cascade"`.
//
//   2. Blocking-bookings (DELETE on park / activity / schedule, day-pass
//      cancel/date-change)
//      { message, blocking_bookings: <int> }
//      Resolution: operator must cancel those bookings first; no cascade
//      shortcut available.
//
//   3. Capacity-lower (PATCH theme park lowering capacity)
//      { message, offending_activities: [{id, name, max_capacity}] }
//      Resolution: lower the listed activities first.

import { ApiError } from "@/lib/api-client";

export type HoursCascadeConflict = {
  schedule_id: number;
  park_activity_id: number;
  date: string;
  start_time: string;
  end_time: string;
  confirmed_bookings: number;
};

export type HoursCascadeResponse = {
  message?: string;
  conflicts: HoursCascadeConflict[];
  counts: { schedules: number; bookings: number };
};

export type BlockingBookingsResponse = {
  message?: string;
  blocking_bookings: number;
};

export type OffendingActivity = {
  id: number;
  name: string;
  max_capacity: number;
};

export type CapacityLowerResponse = {
  message?: string;
  offending_activities: OffendingActivity[];
};

export type CascadeSummary = {
  schedules_cancelled?: number;
  bookings_cancelled?: number;
  schedules_resynced?: number;
};

function dataOf(error: unknown): Record<string, unknown> | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  if (typeof error.data !== "object" || error.data === null) return null;
  return error.data as Record<string, unknown>;
}

export function asHoursCascadeConflict(
  error: unknown,
): HoursCascadeResponse | null {
  const data = dataOf(error);
  if (!data || !Array.isArray(data.conflicts)) return null;
  return data as unknown as HoursCascadeResponse;
}

export function asBlockingBookings(
  error: unknown,
): BlockingBookingsResponse | null {
  const data = dataOf(error);
  if (!data || typeof data.blocking_bookings !== "number") return null;
  return data as unknown as BlockingBookingsResponse;
}

export function asCapacityLower(
  error: unknown,
): CapacityLowerResponse | null {
  const data = dataOf(error);
  if (!data || !Array.isArray(data.offending_activities)) return null;
  return data as unknown as CapacityLowerResponse;
}
