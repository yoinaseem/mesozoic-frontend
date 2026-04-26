// Client-side cascade-delete for beach activities and activity schedules.
//
// The DESD-97 redesign tightened race-safety on the beach domain but did not
// add soft-deletes — `BeachActivity::delete` and
// `BeachActivitySchedule::delete` are hard deletes. The schedule slot-unique
// excludes cancelled rows (so cancelling vacates the slot) but bookings tied
// to a deleted schedule would be orphaned. To deliver the same single-prompt
// "delete this activity → also deletes all schedules and bookings" UX the
// operator validated for park, we walk the dependency tree client-side:
// cancel every confirmed booking, then delete the schedules, then delete the
// activity. Each booking cancel is idempotent and staff-only (`bookings.cancel`).
//
// Mirrors `park-cascade-delete.ts`. Pagination follows the same shrink-as-we-
// go pattern: each cancel removes the row from the `?status=confirmed`
// filter, so we always re-query page 1 — incrementing the page would skip rows.

import { listBeachActivitySchedules } from "@/lib/api/beach-activities";
import { deleteBeachActivity } from "@/lib/api/beach-activities";
import {
  cancelBeachBooking,
  listBeachBookings,
} from "@/lib/api/beach-bookings";
import { deleteBeachActivitySchedule } from "@/lib/api/beach-activity-schedules";

export type CascadeDeleteSummary = {
  bookings_cancelled: number;
  schedules_deleted: number;
};

async function cancelAllBookingsOnSchedule(scheduleId: number): Promise<number> {
  let cancelled = 0;
  for (;;) {
    const res = await listBeachBookings({
      beach_activity_schedule_id: scheduleId,
      status: "confirmed",
      page: 1,
    });
    if (res.data.length === 0) break;
    for (const booking of res.data) {
      await cancelBeachBooking(booking.id);
      cancelled += 1;
    }
  }
  return cancelled;
}

export async function cascadeDeleteBeachActivitySchedule(
  activityId: number,
  scheduleId: number,
): Promise<CascadeDeleteSummary> {
  const bookings_cancelled = await cancelAllBookingsOnSchedule(scheduleId);
  await deleteBeachActivitySchedule(activityId, scheduleId);
  return { bookings_cancelled, schedules_deleted: 1 };
}

export async function cascadeDeleteBeachActivity(
  activityId: number,
): Promise<CascadeDeleteSummary> {
  let bookings_cancelled = 0;
  let schedules_deleted = 0;

  // Walk every schedule under this activity. Re-query page 1 because each
  // delete removes the row from the live list — incrementing would skip rows.
  for (;;) {
    const res = await listBeachActivitySchedules(activityId, 1);
    if (res.data.length === 0) break;

    for (const schedule of res.data) {
      bookings_cancelled += await cancelAllBookingsOnSchedule(schedule.id);
      await deleteBeachActivitySchedule(activityId, schedule.id);
      schedules_deleted += 1;
    }
  }

  await deleteBeachActivity(activityId);
  return { bookings_cancelled, schedules_deleted };
}
