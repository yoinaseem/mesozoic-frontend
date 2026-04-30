"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { StepNav } from "@/components/booking/StepNav";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import {
  listParkActivities,
  listParkActivitySchedules,
} from "@/lib/api/theme-parks";
import { seatPoolOn } from "@/lib/seat-pool";
import type { ParkActivity, ParkActivitySchedule } from "@/types/booking";

// Each row in the day-pass picker corresponds to one (park_id, date)
// pair — coming from either the cart's parkTickets or the existing
// reservation's confirmed parkBookings. Activities for *that* day-pass
// are bookable (server enforces the day-pass-required rule per pair).
type DayPassOption = {
  // Stable id used by the picker — combines park_id + date.
  key: string;
  parkId: number;
  parkName: string;
  date: string;
  // Cap on activity guests, derived from the matching ticket. Activities
  // can't exceed the day-pass guest count (§14).
  guestCap: number;
  source: "cart" | "existing";
};

export function ParkActivityStep() {
  const {
    cart,
    addParkActivity,
    removeParkActivity,
    clearParkActivities,
    existingBookings,
    tripWindow,
    hasNextStep,
    registerStepCommitter,
  } = useBookingCart();

  // Build the day-pass option list each render — small (handful of
  // tickets max) and cheap. Cart tickets win over existing duplicates
  // because the cart values are the ones we'd expect a fresh-add to
  // match against; if both exist for the same (park, date), they're
  // really one pass — the cart entry shadows.
  const dayPassOptions = useMemo<DayPassOption[]>(() => {
    const seen = new Set<string>();
    const out: DayPassOption[] = [];
    for (const ticket of cart.parkTickets) {
      const key = `${ticket.park.id}|${ticket.visitDate}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        key,
        parkId: ticket.park.id,
        parkName: ticket.park.name,
        date: ticket.visitDate,
        guestCap: ticket.guests,
        source: "cart",
      });
    }
    for (const pb of existingBookings.parkBookings) {
      const key = `${pb.park_id}|${pb.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        key,
        parkId: pb.park_id,
        parkName: pb.park?.name ?? `Park #${pb.park_id}`,
        date: pb.date,
        guestCap: pb.guests,
        source: "existing",
      });
    }
    return out;
  }, [cart.parkTickets, existingBookings.parkBookings]);

  // Active day-pass — defaults to first option, but can be switched if
  // the customer holds tickets for multiple parks/dates.
  const [selectedPassKey, setSelectedPassKey] = useState<string | null>(
    dayPassOptions[0]?.key ?? null,
  );

  // Reset the day-pass selection when the option list changes shape:
  // a brand-new ticket should auto-select if nothing is held; a removed
  // ticket whose key was selected falls back to the first remaining.
  // Implemented as render-time setState (the React-recommended
  // alternative to useEffect for "adjust state when prop changes")
  // because setState-in-effect would trigger cascading renders.
  const [prevDayPassOptions, setPrevDayPassOptions] =
    useState(dayPassOptions);
  if (dayPassOptions !== prevDayPassOptions) {
    setPrevDayPassOptions(dayPassOptions);
    if (dayPassOptions.length === 0) {
      if (selectedPassKey !== null) setSelectedPassKey(null);
    } else if (!dayPassOptions.some((opt) => opt.key === selectedPassKey)) {
      setSelectedPassKey(dayPassOptions[0].key);
    }
  }

  const selectedPass = useMemo(() => {
    return dayPassOptions.find((opt) => opt.key === selectedPassKey) ?? null;
  }, [dayPassOptions, selectedPassKey]);

  const effectiveParkId = selectedPass?.parkId ?? null;
  const effectiveDate = selectedPass?.date ?? null;
  const effectiveTicketGuests = selectedPass?.guestCap ?? null;

  const [activities, setActivities] = useState<ParkActivity[]>([]);
  const [loadedActivitiesFor, setLoadedActivitiesFor] = useState<number | null>(
    null,
  );
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null,
  );

  const [schedules, setSchedules] = useState<ParkActivitySchedule[]>([]);
  const [loadedSchedulesFor, setLoadedSchedulesFor] = useState<string | null>(
    null,
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );

  const [guests, setGuests] = useState<number>(effectiveTicketGuests ?? 1);
  const [error, setError] = useState<string | null>(null);

  // Loading is derived: true while a selection is set but its fetch hasn't
  // landed yet. Avoids a synchronous setLoading(true) inside the effect body.
  const loadingActivities =
    effectiveParkId !== null && loadedActivitiesFor !== effectiveParkId;
  const loadingSchedules =
    effectiveParkId !== null &&
    selectedActivityId !== null &&
    loadedSchedulesFor !== `${effectiveParkId}-${selectedActivityId}`;

  useEffect(() => {
    if (effectiveParkId === null) return;
    let cancelled = false;
    const parkId = effectiveParkId;
    listParkActivities(parkId)
      .then((res) => {
        if (cancelled) return;
        setActivities(res.data);
        setLoadedActivitiesFor(parkId);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedActivitiesFor(parkId);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveParkId]);

  useEffect(() => {
    if (effectiveParkId === null || selectedActivityId === null) return;
    let cancelled = false;
    const key = `${effectiveParkId}-${selectedActivityId}`;
    listParkActivitySchedules(effectiveParkId, selectedActivityId)
      .then((res) => {
        if (cancelled) return;
        setSchedules(res.data);
        setLoadedSchedulesFor(key);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedSchedulesFor(key);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveParkId, selectedActivityId]);

  // Activities are park-scoped, not pass-scoped. Invalidate them only when
  // the park id actually changes — switching between two day-passes for the
  // SAME park (e.g. different dates) keeps the cached list. Without this
  // split, clearing `loadedActivitiesFor` on every pass switch left the
  // picker stuck on "Loading…" forever, because the fetch effect's dep is
  // [effectiveParkId] and same-park switches don't re-fire it.
  const [prevParkId, setPrevParkId] = useState(effectiveParkId);
  if (effectiveParkId !== prevParkId) {
    setPrevParkId(effectiveParkId);
    setActivities([]);
    setLoadedActivitiesFor(null);
  }

  // When the day-pass changes, drop the in-progress selection — old pass's
  // activity/schedule isn't valid against the new pass's date or guest cap.
  // Schedules are activity+park scoped, so they invalidate naturally when
  // selectedActivityId clears here.
  const [prevPassKey, setPrevPassKey] = useState(selectedPassKey);
  if (selectedPassKey !== prevPassKey) {
    setPrevPassKey(selectedPassKey);
    setSelectedActivityId(null);
    setSelectedScheduleId(null);
    setSchedules([]);
    setLoadedSchedulesFor(null);
    setError(null);
  }

  const bookableSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (s.status !== "scheduled") return false;
      if (effectiveDate && s.date !== effectiveDate) return false;
      if (tripWindow) {
        if (s.date < tripWindow.checkIn) return false;
        if (s.date >= tripWindow.checkOut) return false;
      }
      return true;
    });
  }, [schedules, effectiveDate, tripWindow]);

  const visibleActivities = effectiveParkId === null ? [] : activities;
  const selectedActivity =
    visibleActivities.find((a) => a.id === selectedActivityId) ?? null;
  const selectedSchedule =
    schedules.find((s) => s.id === selectedScheduleId) ?? null;

  const isAllDay = selectedActivity?.is_all_day === true;

  const formIsTouched = selectedActivityId !== null;

  const resetForm = () => {
    setSelectedActivityId(null);
    setSelectedScheduleId(null);
    setGuests(effectiveTicketGuests ?? 1);
    setError(null);
  };

  const commitSelection = (): boolean => {
    setError(null);
    if (!selectedPass) {
      setError("Pick a day-pass first.");
      return false;
    }
    if (!selectedActivity) {
      setError("Pick an activity.");
      return false;
    }
    if (
      selectedActivity.max_capacity !== null &&
      guests > selectedActivity.max_capacity
    ) {
      setError(
        `This activity accepts up to ${selectedActivity.max_capacity} guests per slot.`,
      );
      return false;
    }
    if (guests < 1) {
      setError("At least one guest is required.");
      return false;
    }

    // Seat pool + day-pass cap (§14). Use whichever date the activity
    // will run on — schedule.date for the timed flow, the day-pass date
    // for the all-day flow.
    const activityDate = isAllDay
      ? effectiveDate
      : selectedSchedule?.date ?? effectiveDate;
    if (activityDate) {
      const pool = seatPoolOn(cart.rooms, activityDate);
      if (pool === 0) {
        setError(
          `No room covers ${activityDate} on this trip. Add a room that includes this date or pick a different slot.`,
        );
        return false;
      }
      if (guests > pool) {
        setError(
          `Activity guests (${guests}) exceed your room seat pool on ${activityDate} (${pool}). Adjust the booking or add another room.`,
        );
        return false;
      }
    }
    if (guests > selectedPass.guestCap) {
      setError(
        `Activity guests (${guests}) exceed the day-pass guests (${selectedPass.guestCap}) for ${selectedPass.parkName} on ${selectedPass.date}.`,
      );
      return false;
    }

    if (isAllDay) {
      if (!effectiveDate) {
        setError("No date is set on the selected day-pass.");
        return false;
      }
      // Duplicate guard: same all-day activity for the same date already
      // staged → 422 server-side. Detect cart-side first.
      const dup = cart.parkActivities.some(
        (a) =>
          a.activity.id === selectedActivity.id && a.date === effectiveDate,
      );
      if (dup) {
        setError(
          "You already have this all-day activity on this date in your cart.",
        );
        return false;
      }
      addParkActivity({
        activity: selectedActivity,
        date: effectiveDate,
        guests,
      });
      toast.success(
        `Added to cart: ${selectedActivity.name} · ${effectiveDate} · ${guests} guest${guests === 1 ? "" : "s"}`,
      );
      return true;
    }

    if (!selectedSchedule) {
      setError("Pick a scheduled time.");
      return false;
    }
    // Duplicate guard for timed flow — same schedule already in cart.
    const stagedScheduleDup = cart.parkActivities.some(
      (a) => a.schedule?.id === selectedSchedule.id,
    );
    if (stagedScheduleDup) {
      setError("You already have this slot in your cart.");
      return false;
    }
    addParkActivity({
      activity: selectedActivity,
      schedule: selectedSchedule,
      guests,
    });
    toast.success(
      `Added to cart: ${selectedActivity.name} · ${selectedSchedule.date} ${selectedSchedule.start_time} · ${guests} guest${guests === 1 ? "" : "s"}`,
    );
    return true;
  };

  // Refs for scroll-on-change UX. After a successful add we scroll the
  // form heading into view so the customer can SEE the form has reset.
  // On a new error message we scroll the error into view.
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [error]);

  const handleAddAnother = () => {
    if (commitSelection()) {
      resetForm();
      formHeadingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleNext = (): boolean => {
    if (!formIsTouched) {
      // Untouched form on a non-last step = "skip this optional step".
      // Last reachable step → require validation feedback.
      if (hasNextStep) return true;
      // No form, but if we have committed activities, allow advance.
      if (cart.parkActivities.length > 0) return true;
      return commitSelection();
    }
    if (!commitSelection()) return false;
    resetForm();
    return true;
  };

  // Ref assignment lives in an effect (no deps) — the react-hooks/refs
  // rule bans ref writes during render.
  const tryCommitRef = useRef<() => boolean>(() => true);
  useEffect(() => {
    tryCommitRef.current = (): boolean => {
      if (!formIsTouched) return true;
      if (!commitSelection()) return false;
      resetForm();
      return true;
    };
  });

  useEffect(() => {
    registerStepCommitter("park-activity", () => tryCommitRef.current());
    return () => registerStepCommitter("park-activity", null);
  }, [registerStepCommitter]);

  // Schedule slots already taken by this same submit's other staged
  // activities (each schedule_id can only be booked once per
  // reservation). Existing-reservation conflicts come from
  // existingBookings.parkActivityScheduleIds; we union the two so the
  // picker doesn't let the user add the same slot twice.
  const stagedScheduleIds = useMemo(() => {
    return new Set(
      cart.parkActivities
        .map((a) => a.schedule?.id)
        .filter((id): id is number => id !== undefined),
    );
  }, [cart.parkActivities]);

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">
          Park activities
        </h2>
        <p className="text-muted text-sm">
          Add-on experiences inside the parks you&rsquo;ve booked. Stack as
          many activities as you like across your day-passes.
        </p>
      </header>

      {cart.parkActivities.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-base-color text-sm font-semibold">
            Park activities in your cart
          </h3>
          <ul className="border-base divide-base divide-y rounded-lg border">
            {cart.parkActivities.map((act, index) => {
              const when = act.schedule
                ? `${act.schedule.date} · ${act.schedule.start_time}`
                : `${act.date ?? "—"} · all day`;
              return (
                <li
                  key={`${act.activity.id}-${act.schedule?.id ?? act.date ?? ""}-${index}`}
                  className="flex items-start justify-between gap-4 px-4 py-3"
                >
                  <div className="space-y-0.5 text-sm">
                    <p className="text-primary font-semibold">
                      {act.activity.name}
                    </p>
                    <p className="text-muted">
                      {when} · {act.guests} guest
                      {act.guests === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeParkActivity(index)}
                    className="text-muted hover:text-danger flex items-center gap-1 text-xs font-semibold"
                    aria-label="Remove park activity"
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {dayPassOptions.length === 0 ? (
        <p className="text-muted text-sm">
          Add a park ticket first to see available activities.
        </p>
      ) : null}

      {dayPassOptions.length > 1 ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-base-color">
            Day-pass to add activities under
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {dayPassOptions.map((opt) => {
              const active = selectedPassKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedPassKey(opt.key)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-base hover:border-primary"
                  }`}
                  aria-pressed={active}
                >
                  <p className="text-primary text-sm font-semibold">
                    {opt.parkName}
                  </p>
                  <p className="text-muted text-xs">
                    {opt.date} · up to {opt.guestCap} guest
                    {opt.guestCap === 1 ? "" : "s"}
                    {opt.source === "existing" ? " · already on trip" : ""}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {dayPassOptions.length > 0 ? (
        <div className="space-y-2">
          <h3
            ref={formHeadingRef}
            className="text-base-color scroll-mt-24 text-sm font-semibold"
          >
            {cart.parkActivities.length === 0
              ? "Pick an activity"
              : "Add another activity"}
          </h3>
          <label className="block text-sm font-medium text-base-color">
            Activity
          </label>
          {loadingActivities ? (
            <p className="text-muted text-sm">Loading activities…</p>
          ) : visibleActivities.length === 0 ? (
            <p className="text-muted text-sm">
              No activities are published for this park yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleActivities.map((activity) => {
                const active = selectedActivityId === activity.id;
                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => {
                      // Toggle: clicking the active tile deselects so
                      // the customer can back out of the form.
                      setSelectedActivityId(active ? null : activity.id);
                      setSelectedScheduleId(null);
                    }}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-base hover:border-primary"
                    }`}
                    aria-pressed={active}
                  >
                    <p className="font-semibold text-primary">{activity.name}</p>
                    <p className="text-muted mt-1 text-sm">
                      {activity.price !== null
                        ? `$${activity.price}`
                        : "Included"}
                      {activity.duration
                        ? ` · ${activity.duration} min`
                        : activity.is_all_day
                        ? " · all day"
                        : ""}
                      {activity.max_capacity
                        ? ` · up to ${activity.max_capacity} per slot`
                        : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {selectedActivityId !== null && isAllDay ? (
        <div className="border-base bg-base/30 space-y-1 rounded-lg border p-3 text-sm">
          <p className="text-base-color font-medium">All-day experience</p>
          <p className="text-muted">
            No time slot to pick — admission runs the full day.{" "}
            {effectiveDate
              ? `Booked for ${effectiveDate} alongside your day-pass.`
              : ""}
          </p>
        </div>
      ) : null}

      {selectedActivityId !== null && !isAllDay ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-base-color">
            Schedule
          </label>
          {loadingSchedules ? (
            <p className="text-muted text-sm">Loading slots…</p>
          ) : bookableSchedules.length === 0 ? (
            <p className="text-muted text-sm">
              {effectiveDate
                ? `No slots for ${effectiveDate} on this activity. Pick a different activity or adjust your park ticket date.`
                : "No upcoming slots scheduled."}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {bookableSchedules.map((s) => {
                const active = selectedScheduleId === s.id;
                const alreadyBooked =
                  existingBookings.parkActivityScheduleIds.has(s.id);
                const alreadyStaged = stagedScheduleIds.has(s.id);
                const disabled = alreadyBooked || alreadyStaged;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedScheduleId(s.id)}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      disabled
                        ? "border-base bg-base/40 opacity-60 cursor-not-allowed"
                        : active
                        ? "border-primary bg-primary/5"
                        : "border-base hover:border-primary"
                    }`}
                    aria-pressed={active}
                  >
                    <p className="font-semibold text-primary">{s.date}</p>
                    <p className="text-muted">
                      {s.start_time ?? "—"}
                      {s.end_time ? ` – ${s.end_time}` : ""}
                      {alreadyBooked
                        ? " · Already booked"
                        : alreadyStaged
                        ? " · In your cart"
                        : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {selectedActivityId !== null ? (
        <div className="max-w-xs">
          <label
            htmlFor="park-activity-guests"
            className="block text-sm font-medium text-base-color"
          >
            Guests
          </label>
          <Input
            id="park-activity-guests"
            type="number"
            min={1}
            max={selectedActivity?.max_capacity ?? 50}
            className="mt-2"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          />
        </div>
      ) : null}

      {error ? (
        <p
          ref={errorRef}
          className="scroll-mt-24 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {dayPassOptions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={handleAddAnother}
          >
            <Plus className="size-4" aria-hidden />
            {cart.parkActivities.length === 0
              ? "Save activity"
              : "Save & add another"}
          </button>
          {formIsTouched ? (
            <button
              type="button"
              className="text-base-color hover:bg-base/40 rounded-lg border border-base px-4 py-2 text-sm font-semibold transition-colors"
              onClick={resetForm}
            >
              Cancel
            </button>
          ) : null}
        </div>
      ) : null}

      <StepNav
        onNext={handleNext}
        leadingActions={
          cart.parkActivities.length > 0 ? (
            <button
              type="button"
              className="text-sm font-semibold text-danger hover:opacity-80"
              onClick={clearParkActivities}
            >
              Clear all activities
            </button>
          ) : null
        }
      />
    </section>
  );
}
