"use client";

import { useEffect, useMemo, useState } from "react";
import { StepNav } from "@/components/booking/StepNav";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import {
  listBeachActivities,
  listBeachActivitySchedules,
} from "@/lib/api/beach-activities";
import type { BeachActivity, BeachActivitySchedule } from "@/types/booking";

export function BeachActivityStep() {
  const { cart, setBeachActivity, existingBookings, primaryRoom, tripWindow } =
    useBookingCart();

  const [activities, setActivities] = useState<BeachActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    cart.beachActivity?.activity.id ?? null,
  );

  const [schedules, setSchedules] = useState<BeachActivitySchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    cart.beachActivity?.schedule.id ?? null,
  );

  const [guests, setGuests] = useState<number>(
    cart.beachActivity?.guests ?? primaryRoom?.guests ?? 1,
  );
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
    setLoadingSchedules(true);
    listBeachActivitySchedules(selectedActivityId)
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
    setBeachActivity({
      activity: selectedActivity,
      schedule: selectedSchedule,
      guests,
    });
    return true;
  };

  const handleNext = (): boolean => {
    if (!formIsTouched && !cart.beachActivity) return true;
    return commitSelection();
  };

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">
          Beach activities
        </h2>
        <p className="text-muted text-sm">
          Snorkel trips, paddle tours, and more along the shoreline.
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
                    <p className="font-semibold text-primary">
                      {s.activity_date}
                    </p>
                    <p className="text-muted">
                      {s.start_time} ·{" "}
                      {alreadyBooked ? "Already booked" : s.status}
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

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <StepNav
        onNext={handleNext}
        leadingActions={
          cart.beachActivity ? (
            <button
              type="button"
              className="text-sm font-semibold text-danger hover:opacity-80"
              onClick={() => setBeachActivity(null)}
            >
              Clear booking
            </button>
          ) : null
        }
      />
    </section>
  );
}
