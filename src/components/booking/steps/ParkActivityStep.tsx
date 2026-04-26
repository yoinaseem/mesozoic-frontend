"use client";

import { useEffect, useMemo, useState } from "react";
import { StepNav } from "@/components/booking/StepNav";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import {
  listParkActivities,
  listParkActivitySchedules,
} from "@/lib/api/theme-parks";
import type { ParkActivity, ParkActivitySchedule } from "@/types/booking";

export function ParkActivityStep() {
  const { cart, setParkActivity, existingBookings, tripWindow } =
    useBookingCart();
  const cartParkTicket = cart.parkTicket;
  // When the user is anchored on an existing reservation that already has
  // a confirmed day-pass, derive the park + visit-date context from it so
  // activities for that day-pass can still be booked. Cart ticket wins
  // when both exist (the just-added ticket is what they're working on).
  const fallbackExistingPass = existingBookings.parkBookings[0] ?? null;
  const effectiveParkId =
    cartParkTicket?.park.id ?? fallbackExistingPass?.park_id ?? null;
  const effectiveDate =
    cartParkTicket?.visitDate ?? fallbackExistingPass?.date ?? null;
  const effectiveParkName =
    cartParkTicket?.park.name ??
    fallbackExistingPass?.park?.name ??
    (effectiveParkId !== null ? `Park #${effectiveParkId}` : null);
  const effectiveTicketGuests =
    cartParkTicket?.guests ?? fallbackExistingPass?.guests ?? null;

  const [activities, setActivities] = useState<ParkActivity[]>([]);
  const [loadedActivitiesFor, setLoadedActivitiesFor] = useState<number | null>(
    null,
  );
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    cart.parkActivity?.activity.id ?? null,
  );

  const [schedules, setSchedules] = useState<ParkActivitySchedule[]>([]);
  const [loadedSchedulesFor, setLoadedSchedulesFor] = useState<string | null>(
    null,
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    cart.parkActivity?.schedule?.id ?? null,
  );

  const [guests, setGuests] = useState<number>(
    cart.parkActivity?.guests ?? effectiveTicketGuests ?? 1,
  );
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

  const commitSelection = (): boolean => {
    setError(null);
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

    if (isAllDay) {
      if (!effectiveDate) {
        setError("Add a park ticket first so we know which date to book.");
        return false;
      }
      setParkActivity({
        activity: selectedActivity,
        date: effectiveDate,
        guests,
      });
      return true;
    }

    if (!selectedSchedule) {
      setError("Pick a scheduled time.");
      return false;
    }
    setParkActivity({
      activity: selectedActivity,
      schedule: selectedSchedule,
      guests,
    });
    return true;
  };

  const handleNext = (): boolean => {
    if (!formIsTouched && !cart.parkActivity) return true;
    return commitSelection();
  };

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">
          Park activities
        </h2>
        <p className="text-muted text-sm">
          {effectiveParkName
            ? `Add-on experiences inside ${effectiveParkName}${
                effectiveDate ? ` on ${effectiveDate}` : ""
              }.`
            : "Pick a park ticket first to see available activities."}
          {!cartParkTicket && fallbackExistingPass ? (
            <span className="block text-xs">
              Using your existing day-pass on this trip.
            </span>
          ) : null}
        </p>
      </header>

      <div className="space-y-2">
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
                    setSelectedActivityId(activity.id);
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

      {selectedActivityId !== null && isAllDay ? (
        <div className="border-base bg-base/30 space-y-1 rounded-lg border p-3 text-sm">
          <p className="text-base-color font-medium">All-day experience</p>
          <p className="text-muted">
            No time slot to pick — admission runs the full day.{" "}
            {effectiveDate
              ? `Booked for ${effectiveDate} alongside your day-pass.`
              : "Add a park ticket first to set the date."}
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
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={alreadyBooked}
                    onClick={() => setSelectedScheduleId(s.id)}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      alreadyBooked
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
                      {alreadyBooked ? " · Already booked" : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

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

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <StepNav
        onNext={handleNext}
        leadingActions={
          cart.parkActivity ? (
            <button
              type="button"
              className="text-sm font-semibold text-danger hover:opacity-80"
              onClick={() => setParkActivity(null)}
            >
              Clear activity
            </button>
          ) : null
        }
      />
    </section>
  );
}
