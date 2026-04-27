// Pre-checkout validation. Customer-facing flow shouldn't show 422s, so we
// re-fetch each staged item's authoritative state and surface
// human-readable issues *before* the customer hits "Confirm and book".
//
// Issue severity:
//   - "error"   = the booking will be rejected if submitted as-is. The
//                 user must fix the affected step.
//   - "warning" = something is uncertain but the API may still accept it
//                 (e.g. hours not yet published). Customer can proceed.
//
// Best-effort: a fetch failure produces no issue. The submit pipeline is
// the final source of truth — pre-validation just narrows the surface.

import { listBeachActivitySchedules } from "@/lib/api/beach-activities";
import { getHotelAvailabilityDaily } from "@/lib/api/hotels";
import {
  getEffectiveHours,
  listParkActivitySchedules,
} from "@/lib/api/theme-parks";
import { seatPoolOn } from "@/lib/seat-pool";
import type { BookingCart, BookingStep } from "@/types/booking";

export type PrevalidationIssue = {
  step: BookingStep;
  severity: "warning" | "error";
  message: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function validateRooms(cart: BookingCart): Promise<PrevalidationIssue[]> {
  const issues: PrevalidationIssue[] = [];
  const newRooms = cart.rooms.filter((r) => r.existingId === undefined);

  await Promise.all(
    newRooms.map(async (room) => {
      try {
        const res = await getHotelAvailabilityDaily(
          room.hotel.id,
          room.checkIn,
          room.checkOut,
        );
        const rt = res.data.room_types.find(
          (r) => r.room_type_id === room.roomType.id,
        );
        if (!rt) {
          issues.push({
            step: "room",
            severity: "error",
            message: `${room.roomType.name} is no longer published at ${room.hotel.name}.`,
          });
          return;
        }
        // Daily endpoint returns one entry per night in [checkIn, checkOut).
        const shortage = rt.days.find((d) => d.free <= 0);
        if (shortage) {
          issues.push({
            step: "room",
            severity: "error",
            message: `No ${room.roomType.name} rooms free on ${shortage.date} at ${room.hotel.name}.`,
          });
        }
      } catch {
        // Network or 404 — let the API decide on submit.
      }
    }),
  );

  return issues;
}

async function validateParkTicket(
  cart: BookingCart,
): Promise<PrevalidationIssue[]> {
  if (!cart.parkTicket) return [];
  const issues: PrevalidationIssue[] = [];
  const t = cart.parkTicket;

  if (t.visitDate < todayIso()) {
    issues.push({
      step: "park-ticket",
      severity: "error",
      message: `Visit date ${t.visitDate} is in the past — pick a future date.`,
    });
  }

  const pool = seatPoolOn(cart.rooms, t.visitDate);
  if (pool === 0) {
    issues.push({
      step: "park-ticket",
      severity: "error",
      message: `No room covers ${t.visitDate}. Add a room that includes this date or change the visit date.`,
    });
  } else if (t.guests > pool) {
    issues.push({
      step: "park-ticket",
      severity: "error",
      message: `Park ticket guests (${t.guests}) exceed your room seat pool on ${t.visitDate} (${pool}).`,
    });
  }

  try {
    const res = await getEffectiveHours(t.park.id, { date: t.visitDate });
    const list = Array.isArray(res) ? res : res.data;
    const hours = list[0];
    if (hours && hours.status === "closed") {
      issues.push({
        step: "park-ticket",
        severity: "error",
        message: `${t.park.name} is closed on ${t.visitDate}${
          hours.note ? ` (${hours.note})` : ""
        }.`,
      });
    } else if (!hours) {
      issues.push({
        step: "park-ticket",
        severity: "warning",
        message: `Hours aren't published yet for ${t.park.name} on ${t.visitDate}.`,
      });
    }
  } catch {}

  return issues;
}

async function validateBeachActivity(
  cart: BookingCart,
): Promise<PrevalidationIssue[]> {
  if (!cart.beachActivity) return [];
  const issues: PrevalidationIssue[] = [];
  const ba = cart.beachActivity;
  const today = todayIso();

  if ((ba.schedule.activity_date ?? "") < today) {
    issues.push({
      step: "beach-activity",
      severity: "error",
      message: `${ba.activity.name} on ${ba.schedule.activity_date} is in the past.`,
    });
  }

  const date = ba.schedule.activity_date;
  if (date) {
    const pool = seatPoolOn(cart.rooms, date);
    if (pool === 0) {
      issues.push({
        step: "beach-activity",
        severity: "error",
        message: `No room covers ${date}. Add a room that includes this date or pick a different session.`,
      });
    } else if (ba.guests > pool) {
      issues.push({
        step: "beach-activity",
        severity: "error",
        message: `Beach activity guests (${ba.guests}) exceed your room seat pool on ${date} (${pool}).`,
      });
    }
  }

  try {
    const res = await listBeachActivitySchedules(ba.activity.id);
    const fresh = res.data.find((s) => s.id === ba.schedule.id);
    if (!fresh) {
      issues.push({
        step: "beach-activity",
        severity: "error",
        message: `The beach activity slot you picked is no longer published.`,
      });
    } else if (fresh.status === "cancelled") {
      issues.push({
        step: "beach-activity",
        severity: "error",
        message: `${ba.activity.name} on ${fresh.activity_date} has been cancelled by staff. Pick another slot.`,
      });
    }
  } catch {}

  return issues;
}

async function validateParkActivity(
  cart: BookingCart,
): Promise<PrevalidationIssue[]> {
  if (!cart.parkActivity) return [];
  const issues: PrevalidationIssue[] = [];
  const pa = cart.parkActivity;
  const today = todayIso();
  const parkId = cart.parkTicket?.park.id ?? pa.activity.park_id;
  const activityDate = pa.schedule?.date ?? pa.date ?? null;

  if (activityDate) {
    const pool = seatPoolOn(cart.rooms, activityDate);
    if (pool === 0) {
      issues.push({
        step: "park-activity",
        severity: "error",
        message: `No room covers ${activityDate}. Add a room that includes this date or pick a different slot.`,
      });
    } else if (pa.guests > pool) {
      issues.push({
        step: "park-activity",
        severity: "error",
        message: `Activity guests (${pa.guests}) exceed your room seat pool on ${activityDate} (${pool}).`,
      });
    }
  }
  if (
    cart.parkTicket &&
    cart.parkTicket.visitDate === activityDate &&
    pa.guests > cart.parkTicket.guests
  ) {
    issues.push({
      step: "park-activity",
      severity: "error",
      message: `Activity guests (${pa.guests}) exceed the day-pass guests (${cart.parkTicket.guests}).`,
    });
  }

  if (pa.schedule) {
    if (pa.schedule.date < today) {
      issues.push({
        step: "park-activity",
        severity: "error",
        message: `${pa.activity.name} on ${pa.schedule.date} is in the past.`,
      });
    }

    try {
      const res = await listParkActivitySchedules(parkId, pa.activity.id);
      const fresh = res.data.find((s) => s.id === pa.schedule!.id);
      if (!fresh) {
        issues.push({
          step: "park-activity",
          severity: "error",
          message: `The park activity slot you picked is no longer published.`,
        });
      } else if (fresh.status !== "scheduled") {
        issues.push({
          step: "park-activity",
          severity: "error",
          message: `${pa.activity.name} on ${fresh.date} is ${fresh.status}. Pick another slot.`,
        });
      }
    } catch {}
  } else if (pa.date) {
    if (pa.date < today) {
      issues.push({
        step: "park-activity",
        severity: "error",
        message: `${pa.activity.name} on ${pa.date} is in the past.`,
      });
    }

    // All-day activities materialise their schedule on POST against the
    // park's effective hours. If the park is closed for that date the
    // server returns 422 — pre-empt with the same hours check.
    try {
      const res = await getEffectiveHours(parkId, { date: pa.date });
      const list = Array.isArray(res) ? res : res.data;
      const hours = list[0];
      if (hours && hours.status === "closed") {
        issues.push({
          step: "park-activity",
          severity: "error",
          message: `Park is closed on ${pa.date} — the all-day activity can't run.`,
        });
      }
    } catch {}
  }

  return issues;
}

async function validateFerry(
  cart: BookingCart,
): Promise<PrevalidationIssue[]> {
  if (!cart.ferry) return [];
  const issues: PrevalidationIssue[] = [];
  const f = cart.ferry;
  const today = todayIso();

  if (f.travelDate < today) {
    issues.push({
      step: "ferry",
      severity: "error",
      message: `Ferry travel date ${f.travelDate} is in the past.`,
    });
  }
  // Ferry uses the inclusive seat-pool variant (§15).
  const pool = seatPoolOn(cart.rooms, f.travelDate, {
    exclusiveCheckout: false,
  });
  if (pool === 0) {
    issues.push({
      step: "ferry",
      severity: "error",
      message: `No room covers ${f.travelDate}. Add a room that includes this date or pick a different travel date.`,
    });
  } else if (f.passengers > pool) {
    issues.push({
      step: "ferry",
      severity: "error",
      message: `Ferry passengers (${f.passengers}) exceed your room seat pool on ${f.travelDate} (${pool}).`,
    });
  }
  // Park-closed-cascade rule (§15) is enforced server-side; surfacing it
  // here would require fetching effective hours for *every* park, which
  // isn't worth the bandwidth for V1. The submit error message will read
  // "Ferries are not available on this date because the park is closed."
  // if it triggers — clear enough for the customer to act on.

  return issues;
}

export async function prevalidateCart(
  cart: BookingCart,
): Promise<PrevalidationIssue[]> {
  const groups = await Promise.all([
    validateRooms(cart),
    validateParkTicket(cart),
    validateBeachActivity(cart),
    validateParkActivity(cart),
    validateFerry(cart),
  ]);
  return groups.flat();
}
