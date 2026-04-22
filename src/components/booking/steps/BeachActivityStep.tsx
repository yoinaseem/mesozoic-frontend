"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import {
  listBeachActivities,
  listBeachActivitySchedules,
} from "@/lib/api/beach-activities";
import type { BeachActivity, BeachActivitySchedule } from "@/types/booking";

export function BeachActivityStep() {
  const { cart, setBeachActivity } = useBookingCart();

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
    cart.beachActivity?.guests ?? cart.room?.guests ?? 1,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingActivities(true);
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
    if (selectedActivityId === null) {
      setSchedules([]);
      return;
    }
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
  const bookableSchedules = useMemo(
    () => schedules.filter((s) => s.status !== "cancelled"),
    [schedules],
  );

  const selectedActivity =
    activities.find((a) => a.id === selectedActivityId) ?? null;
  const selectedSchedule =
    schedules.find((s) => s.id === selectedScheduleId) ?? null;

  const handleConfirm = () => {
    setError(null);
    if (!selectedActivity || !selectedSchedule) {
      setError("Pick a beach activity and a schedule.");
      return;
    }
    if (guests < 1) {
      setError("At least one guest is required.");
      return;
    }
    if (guests > selectedActivity.capacity) {
      setError(
        `This activity accepts up to ${selectedActivity.capacity} guests per session.`,
      );
      return;
    }
    setBeachActivity({
      activity: selectedActivity,
      schedule: selectedSchedule,
      guests,
    });
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
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedScheduleId(s.id)}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-base hover:border-primary"
                    }`}
                    aria-pressed={active}
                  >
                    <p className="font-semibold text-primary">
                      {s.activity_date}
                    </p>
                    <p className="text-muted">
                      {s.start_time} · {s.status}
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

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={handleConfirm}>
          {cart.beachActivity ? "Update booking" : "Confirm booking"}
        </button>
        {cart.beachActivity ? (
          <button
            type="button"
            className="text-sm font-semibold text-danger hover:opacity-80"
            onClick={() => setBeachActivity(null)}
          >
            Clear booking
          </button>
        ) : null}
      </div>
    </section>
  );
}
