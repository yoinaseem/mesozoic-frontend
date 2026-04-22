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
  const { cart, setParkActivity } = useBookingCart();
  const park = cart.parkTicket?.park ?? null;

  const [activities, setActivities] = useState<ParkActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    cart.parkActivity?.activity.id ?? null,
  );

  const [schedules, setSchedules] = useState<ParkActivitySchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    cart.parkActivity?.schedule.id ?? null,
  );

  const [guests, setGuests] = useState<number>(
    cart.parkActivity?.guests ?? cart.parkTicket?.guests ?? 1,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!park) {
      setActivities([]);
      return;
    }
    let cancelled = false;
    setLoadingActivities(true);
    listParkActivities(park.id)
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
  }, [park]);

  useEffect(() => {
    if (!park || selectedActivityId === null) {
      setSchedules([]);
      return;
    }
    let cancelled = false;
    setLoadingSchedules(true);
    listParkActivitySchedules(park.id, selectedActivityId)
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
  }, [park, selectedActivityId]);

  const bookableSchedules = useMemo(
    () => schedules.filter((s) => s.status === "scheduled"),
    [schedules],
  );

  const selectedActivity =
    activities.find((a) => a.id === selectedActivityId) ?? null;
  const selectedSchedule =
    schedules.find((s) => s.id === selectedScheduleId) ?? null;

  const handleConfirm = () => {
    setError(null);
    if (!selectedActivity || !selectedSchedule) {
      setError("Pick an activity and a scheduled time.");
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
          {park
            ? `Add-on experiences inside ${park.name}.`
            : "Pick a park ticket first to see available activities."}
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

      {selectedActivityId !== null ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-base-color">
            Schedule
          </label>
          {loadingSchedules ? (
            <p className="text-muted text-sm">Loading slots…</p>
          ) : bookableSchedules.length === 0 ? (
            <p className="text-muted text-sm">No upcoming slots scheduled.</p>
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
                    <p className="font-semibold text-primary">{s.date}</p>
                    <p className="text-muted">
                      {s.start_time ?? "—"}
                      {s.end_time ? ` – ${s.end_time}` : ""}
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
