"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import {
  listParkActivities,
  listParkActivitySchedules,
} from "@/lib/api/theme-parks";
import type { ParkActivity, ParkActivitySchedule } from "@/types/booking";

export function ParkActivityStep() {
  const { cart, setParkActivity, existingBookings } = useBookingCart();
  const room = cart.room;
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
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    cart.parkActivity?.activity.id ?? null,
  );

  const [schedules, setSchedules] = useState<ParkActivitySchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    cart.parkActivity?.schedule?.id ?? null,
  );

  const [guests, setGuests] = useState<number>(
    cart.parkActivity?.guests ?? effectiveTicketGuests ?? 1,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (effectiveParkId === null) {
      setActivities([]);
      return;
    }
    let cancelled = false;
    setLoadingActivities(true);
    listParkActivities(effectiveParkId)
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
  }, [effectiveParkId]);

  useEffect(() => {
    if (effectiveParkId === null || selectedActivityId === null) {
      setSchedules([]);
      return;
    }
    let cancelled = false;
    setLoadingSchedules(true);
    listParkActivitySchedules(effectiveParkId, selectedActivityId)
      .then((res) => {
        if (cancelled) return;
        setSchedules(res.data);
        setLoadingSchedules(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadingSchedules(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveParkId, selectedActivityId]);

  // The day-pass coupling rule (§14): activity date must match the held
  // park ticket's date. The room-window check is also enforced because the
  // server re-validates seatPoolOn (exclusive checkout).
  const bookableSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (s.status !== "scheduled") return false;
      if (effectiveDate && s.date !== effectiveDate) return false;
      if (room) {
        if (s.date < room.checkIn) return false;
        if (s.date >= room.checkOut) return false;
      }
      return true;
    });
  }, [schedules, effectiveDate, room]);

  const selectedActivity =
    activities.find((a) => a.id === selectedActivityId) ?? null;
  const selectedSchedule =
    schedules.find((s) => s.id === selectedScheduleId) ?? null;

  const isAllDay = selectedActivity?.is_all_day === true;

  const handleConfirm = () => {
    setError(null);
    if (!selectedActivity) {
      setError("Pick an activity.");
      return;
    }
    if (
      selectedActivity.max_capacity !== null &&
      guests > selectedActivity.max_capacity
    ) {
      setError(
        `This activity accepts up to ${selectedActivity.max_capacity} guests per slot.`,
      );
      return;
    }
    if (guests < 1) {
      setError("At least one guest is required.");
      return;
    }

    if (isAllDay) {
      // All-day flow: server materialises the schedule from (activity, date).
      // Use the day-pass date as the booking date — that's the only date the
      // user could plausibly mean for this trip, and it lines up with the
      // (park, date) day-pass prerequisite the API enforces.
      if (!effectiveDate) {
        setError("Add a park ticket first so we know which date to book.");
        return;
      }
      setParkActivity({
        activity: selectedActivity,
        date: effectiveDate,
        guests,
      });
      return;
    }

    if (!selectedSchedule) {
      setError("Pick a scheduled time.");
      return;
    }
    setParkActivity({
      activity: selectedActivity,
      schedule: selectedSchedule,
      guests,
    });
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
        ) : activities.length === 0 ? (
          <p className="text-muted text-sm">
            No activities are published for this park yet.
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

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={handleConfirm}>
          {cart.parkActivity ? "Update activity" : "Confirm activity"}
        </button>
        {cart.parkActivity ? (
          <button
            type="button"
            className="text-sm font-semibold text-danger hover:opacity-80"
            onClick={() => setParkActivity(null)}
          >
            Clear activity
          </button>
        ) : null}
      </div>
    </section>
  );
}
