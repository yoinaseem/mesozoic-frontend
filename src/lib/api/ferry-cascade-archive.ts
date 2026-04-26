// Server-driven cascade-archive for ferry types, ferries, and slots.
//
// DESD-100 ships a real server-side cascade for all three ferry resources:
// `DELETE` returns `409 {message, blocking_bookings}` by default, and the
// caller can re-issue the same `DELETE` with `{on_conflict: "cascade"}` in
// the body to archive the row + descendants and cancel the affected bookings
// in one transaction. Successful cascade returns `200 {cascade: {…counts}}`;
// an empty cascade (no blocking bookings) returns `204` with no body.
//
// The pattern mirrors the park hours-cascade (§9): try the safe path first,
// surface the structured 409 to the operator, retry with cascade only after
// explicit confirmation.

import { ApiError } from "@/lib/api-client";
import { deleteFerry } from "@/lib/api/ferries";
import { deleteFerryType } from "@/lib/api/ferry-types";
import { deleteFerrySchedule } from "@/lib/api/ferry-schedules";

export type FerryCascadeCounts = {
  bookings_cancelled?: number;
  slots_archived?: number;
  ferries_archived?: number;
};

export type FerryCascadeOutcome =
  | { kind: "empty" }
  | { kind: "cascaded"; counts: FerryCascadeCounts };

type CascadeResponse = {
  cascade?: FerryCascadeCounts;
};

// Empty `204` responses come back as `null`; `200` payloads carry a `cascade`
// object. Either is success — collapse to a single shape.
function toCascadeOutcome(raw: unknown): FerryCascadeOutcome {
  if (raw && typeof raw === "object" && "cascade" in raw) {
    const counts = (raw as CascadeResponse).cascade ?? {};
    return { kind: "cascaded", counts };
  }
  return { kind: "empty" };
}

export type BlockingBookingsConflict = {
  message?: string;
  blocking_bookings: number;
};

// Surfaces the `409 {message, blocking_bookings}` shape if that's what the
// error is. Any other error (network, 500, 422 on a malformed body) returns
// null and the caller falls through to its normal error path.
export function asFerryBlockingBookings(
  error: unknown,
): BlockingBookingsConflict | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  if (typeof error.data !== "object" || error.data === null) return null;
  const data = error.data as Record<string, unknown>;
  if (typeof data.blocking_bookings !== "number") return null;
  return data as unknown as BlockingBookingsConflict;
}

export async function cascadeArchiveFerryType(
  typeId: number,
): Promise<FerryCascadeOutcome> {
  const raw = await deleteFerryType(typeId, "cascade");
  return toCascadeOutcome(raw);
}

export async function cascadeArchiveFerry(
  ferryId: number,
): Promise<FerryCascadeOutcome> {
  const raw = await deleteFerry(ferryId, "cascade");
  return toCascadeOutcome(raw);
}

export async function cascadeArchiveFerrySchedule(
  scheduleId: number,
): Promise<FerryCascadeOutcome> {
  const raw = await deleteFerrySchedule(scheduleId, "cascade");
  return toCascadeOutcome(raw);
}
