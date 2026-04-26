// Client-side cascade-delete for park activities and activity schedules.
//
// The API blocks `DELETE` on a park activity or activity schedule with a 409
// when upcoming confirmed `ParkActivityBooking` rows reference it. There's no
// server-side `?on_conflict=cascade` query for these endpoints. To deliver
// the "one prompt cancels everything" UX the operator asked for, we walk the
// dependency tree client-side: cancel every confirmed booking, then delete
// the parent. Each booking cancel is idempotent and staff-only.

import { listParkActivityBookings, cancelParkActivityBooking } from "@/lib/api/park-activity-bookings";
import { deleteParkActivity } from "@/lib/api/park-activities";
import { deleteParkActivitySchedule } from "@/lib/api/park-activity-schedules";
import { listParkActivitySchedules } from "@/lib/api/theme-parks";

export type CascadeDeleteSummary = {
  bookings_cancelled: number;
  schedules_deleted: number;
};

async function cancelAllBookingsOnSchedule(scheduleId: number): Promise<number> {
  let cancelled = 0;
  // Paginate through every confirmed booking on this schedule. We fetch only
  // confirmed rows because cancelled ones don't block the parent delete.
  // We always re-query page 1 because cancelled rows drop out of the
  // `status=confirmed` filter as we go — incrementing the page would skip
  // rows. The API returns 10/page (§14).
  for (;;) {
    const res = await listParkActivityBookings({
      park_activity_schedule_id: scheduleId,
      status: "confirmed",
      page: 1,
    });
    if (res.data.length === 0) break;

    // Cancel sequentially: a single park-manager triggering a cascade is
    // light traffic and sequential keeps server-side row locks well-behaved.
    for (const booking of res.data) {
      await cancelParkActivityBooking(booking.id);
      cancelled += 1;
    }
  }
  return cancelled;
}

export async function cascadeDeleteParkActivitySchedule(
  parkId: number,
  activityId: number,
  scheduleId: number,
): Promise<CascadeDeleteSummary> {
  const bookings_cancelled = await cancelAllBookingsOnSchedule(scheduleId);
  await deleteParkActivitySchedule(parkId, activityId, scheduleId);
  return { bookings_cancelled, schedules_deleted: 1 };
}

export async function cascadeDeleteParkActivity(
  parkId: number,
  activityId: number,
): Promise<CascadeDeleteSummary> {
  let bookings_cancelled = 0;
  let schedules_deleted = 0;

  // Walk every live schedule under this activity, cancel bookings, then
  // delete the schedule itself so the parent activity has no live children
  // when we hit it. Same shrink-as-we-go logic — re-query page 1 because
  // each delete archives the row and removes it from the live list.
  for (;;) {
    const res = await listParkActivitySchedules(parkId, activityId, 1);
    if (res.data.length === 0) break;

    for (const schedule of res.data) {
      bookings_cancelled += await cancelAllBookingsOnSchedule(schedule.id);
      await deleteParkActivitySchedule(parkId, activityId, schedule.id);
      schedules_deleted += 1;
    }
  }

  await deleteParkActivity(parkId, activityId);
  return { bookings_cancelled, schedules_deleted };
}
