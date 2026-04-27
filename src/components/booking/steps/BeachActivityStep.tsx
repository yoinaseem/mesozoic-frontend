"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { StepNav } from "@/components/booking/StepNav";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import {
  listBeachActivities,
  listBeachActivitySchedules,
} from "@/lib/api/beach-activities";
import { seatPoolOn } from "@/lib/seat-pool";
import type { BeachActivity, BeachActivitySchedule } from "@/types/booking";

export function BeachActivityStep() {
  const {
    cart,
    addBeachActivity,
    removeBeachActivity,
    clearBeachActivities,
    existingBookings,
    primaryRoom,
    tripWindow,
    hasNextStep,
    registerStepCommitter,
  } = useBookingCart();

  const [activities, setActivities] = useState<BeachActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null,
  );

  const [schedules, setSchedules] = useState<BeachActivitySchedule[]>([]);
  // Loading is derived from a "loadedFor" tracker — same pattern as
  // FerryStep / ThemeParkStep, avoids the setLoading-in-effect lint flag.
  const [schedulesLoadedFor, setSchedulesLoadedFor] = useState<number | null>(
    null,
  );
  const loadingSchedules =
    selectedActivityId !== null && schedulesLoadedFor !== selectedActivityId;
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );

  const [guests, setGuests] = useState<number>(primaryRoom?.guests ?? 1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listBeachActivities()
      .then((res) => {
        if (cancelled) return;
        setActivities(res.data);
        setLoadingActivities(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadingActivities(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedActivityId === null) return;
    let cancelled = false;
    const activityId = selectedActivityId;
    listBeachActivitySchedules(activityId)
      .then((res) => {
        if (cancelled) return;
        setSchedules(res.data);
        setSchedulesLoadedFor(activityId);
      })
      .catch(() => {
        if (cancelled) return;
        setSchedulesLoadedFor(activityId);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedActivityId]);

  // Beach schedules go pending → confirmed; cancelled is the only hard exclusion.
  // Beach uses Reservation::seatPoolOn which excludes the check-out date, so
  // any schedule on or after check-out is unbookable for this trip.
  const bookableSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (s.status === "cancelled") return false;
      if (tripWindow) {
        if (s.activity_date < tripWindow.checkIn) return false;
        if (s.activity_date >= tripWindow.checkOut) return false;
      }
      return true;
    });
  }, [schedules, tripWindow]);

  const selectedActivity =
    activities.find((a) => a.id === selectedActivityId) ?? null;
  const selectedSchedule =
    schedules.find((s) => s.id === selectedScheduleId) ?? null;

  const formIsTouched = selectedActivityId !== null;

  const stagedScheduleIds = useMemo(() => {
    return new Set(cart.beachActivities.map((b) => b.schedule.id));
  }, [cart.beachActivities]);

  const resetForm = () => {
    setSelectedActivityId(null);
    setSelectedScheduleId(null);
    setGuests(primaryRoom?.guests ?? 1);
    setError(null);
  };

  const commitSelection = (): boolean => {
    setError(null);
    if (!selectedActivity || !selectedSchedule) {
      setError("Pick a beach activity and a schedule.");
      return false;
    }
    if (guests < 1) {
      setError("At least one guest is required.");
      return false;
    }
    if (guests > selectedActivity.capacity) {
      setError(
        `This activity accepts up to ${selectedActivity.capacity} guests per session.`,
      );
      return false;
    }
    // Reservation seat pool — beach uses exclusive checkout (§13).
    const pool = seatPoolOn(cart.rooms, selectedSchedule.activity_date);
    if (pool === 0) {
      setError(
        `No room covers ${selectedSchedule.activity_date} on this trip. Add a room that includes this date or pick a different session.`,
      );
      return false;
    }
    if (guests > pool) {
      setError(
        `Beach activity guests (${guests}) exceed your room seat pool on ${selectedSchedule.activity_date} (${pool}). Adjust the booking or add another room.`,
      );
      return false;
    }
    // Duplicate guard — same schedule can't be booked twice on a single
    // reservation (server returns 422 errors.beach_activity_schedule_id).
    if (stagedScheduleIds.has(selectedSchedule.id)) {
      setError("You already have this session in your cart.");
      return false;
    }
    if (existingBookings.beachScheduleIds.has(selectedSchedule.id)) {
      setError("Your existing trip already includes this session.");
      return false;
    }
    addBeachActivity({
      activity: selectedActivity,
      schedule: selectedSchedule,
      guests,
    });
    toast.success(
      `Added to cart: ${selectedActivity.name} · ${selectedSchedule.activity_date} · ${guests} guest${guests === 1 ? "" : "s"}`,
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
      if (hasNextStep) return true;
      if (cart.beachActivities.length > 0) return true;
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
    registerStepCommitter("beach-activity", () => tryCommitRef.current());
    return () => registerStepCommitter("beach-activity", null);
  }, [registerStepCommitter]);

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">
          Beach activities
        </h2>
        <p className="text-muted text-sm">
          Snorkel trips, paddle tours, and more along the shoreline. Add as
          many sessions as you like across your stay.
        </p>
      </header>

      {cart.beachActivities.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-base-color text-sm font-semibold">
            Beach activities in your cart
          </h3>
          <ul className="border-base divide-base divide-y rounded-lg border">
            {cart.beachActivities.map((act, index) => (
              <li
                key={`${act.schedule.id}-${index}`}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="space-y-0.5 text-sm">
                  <p className="text-primary font-semibold">
                    {act.activity.name}
                  </p>
                  <p className="text-muted">
                    {act.schedule.activity_date} · {act.schedule.start_time}
                    {" · "}
                    {act.guests} guest{act.guests === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeBeachActivity(index)}
                  className="text-muted hover:text-danger flex items-center gap-1 text-xs font-semibold"
                  aria-label="Remove beach activity"
                >
                  <Trash2 className="size-4" />
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <h3
          ref={formHeadingRef}
          className="text-base-color scroll-mt-24 text-sm font-semibold"
        >
          {cart.beachActivities.length === 0
            ? "Pick an activity"
            : "Add another activity"}
        </h3>
        <label className="block text-sm font-medium text-base-color">
          Activity
        </label>
        {loadingActivities ? (
          <p className="text-muted text-sm">Loading activities…</p>
        ) : activities.length === 0 ? (
          <p className="text-muted text-sm">
            No beach activities are listed yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activities.map((activity) => {
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
                    ${activity.price} · {activity.duration} min · up to{" "}
                    {activity.capacity} guests
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedActivityId !== null ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-base-color">
            Schedule
          </label>
          {loadingSchedules ? (
            <p className="text-muted text-sm">Loading slots…</p>
          ) : bookableSchedules.length === 0 ? (
            <p className="text-muted text-sm">No upcoming sessions.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {bookableSchedules.map((s) => {
                const active = selectedScheduleId === s.id;
                const alreadyBooked = existingBookings.beachScheduleIds.has(
                  s.id,
                );
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
                    <p className="font-semibold text-primary">
                      {s.activity_date}
                    </p>
                    <p className="text-muted">
                      {s.start_time} ·{" "}
                      {alreadyBooked
                        ? "Already booked"
                        : alreadyStaged
                        ? "In your cart"
                        : s.status}
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
            htmlFor="beach-guests"
            className="block text-sm font-medium text-base-color"
          >
            Guests
          </label>
          <Input
            id="beach-guests"
            type="number"
            min={1}
            max={selectedActivity?.capacity ?? 50}
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={handleAddAnother}
        >
          <Plus className="size-4" aria-hidden />
          {cart.beachActivities.length === 0
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

      <StepNav
        onNext={handleNext}
        leadingActions={
          cart.beachActivities.length > 0 ? (
            <button
              type="button"
              className="text-sm font-semibold text-danger hover:opacity-80"
              onClick={clearBeachActivities}
            >
              Clear all activities
            </button>
          ) : null
        }
      />
    </section>
  );
}
