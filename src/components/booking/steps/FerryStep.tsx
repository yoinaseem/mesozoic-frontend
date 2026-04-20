"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import { listFerries, listFerrySchedules } from "@/lib/api/ferries";
import type { Ferry, FerrySchedule } from "@/types/booking";

function formatDateDdMmYyyy(date: string): string {
  const dateOnly = date.split("T")[0];
  const parts = dateOnly.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return date;
}

export function FerryStep() {
  const { cart, setFerry } = useBookingCart();

  const [ferries, setFerries] = useState<Ferry[]>([]);
  const [loadingFerries, setLoadingFerries] = useState(true);
  const [selectedFerryId, setSelectedFerryId] = useState<number | null>(
    cart.ferry?.ferry.id ?? null,
  );

  const [schedules, setSchedules] = useState<FerrySchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    cart.ferry?.schedule.id ?? null,
  );

  const [passengers, setPassengers] = useState<number>(
    cart.ferry?.passengers ?? cart.room?.guests ?? 1,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingFerries(true);
    listFerries()
      .then((res) => {
        if (cancelled) return;
        setFerries(res.data);
        setLoadingFerries(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadingFerries(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedFerryId === null) {
      setSchedules([]);
      return;
    }
    let cancelled = false;
    setLoadingSchedules(true);
    listFerrySchedules(selectedFerryId)
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
  }, [selectedFerryId]);

  const bookableSchedules = useMemo(
    () => schedules.filter((s) => s.status === "scheduled"),
    [schedules],
  );

  const selectedFerry = ferries.find((f) => f.id === selectedFerryId) ?? null;
  const selectedSchedule =
    schedules.find((s) => s.id === selectedScheduleId) ?? null;

  const handleConfirm = () => {
    setError(null);
    if (!selectedFerry || !selectedSchedule) {
      setError("Pick a ferry and a scheduled departure.");
      return;
    }
    if (passengers < 1) {
      setError("At least one passenger is required.");
      return;
    }
    if (passengers > selectedFerry.capacity) {
      setError(`This ferry carries up to ${selectedFerry.capacity} passengers.`);
      return;
    }
    setFerry({ ferry: selectedFerry, schedule: selectedSchedule, passengers });
  };

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">Ferry booking</h2>
        <p className="text-muted text-sm">
          Pick a ferry and see its full departure schedule before locking in a
          crossing.
        </p>
      </header>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-base-color">
          Ferry
        </label>
        {loadingFerries ? (
          <p className="text-muted text-sm">Loading ferries…</p>
        ) : ferries.length === 0 ? (
          <p className="text-muted text-sm">No ferries are listed yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ferries.map((ferry) => {
              const active = selectedFerryId === ferry.id;
              return (
                <button
                  key={ferry.id}
                  type="button"
                  onClick={() => {
                    setSelectedFerryId(ferry.id);
                    setSelectedScheduleId(null);
                  }}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-base hover:border-primary"
                  }`}
                  aria-pressed={active}
                >
                  <p className="font-semibold text-primary">{ferry.name}</p>
                  <p className="text-muted mt-1 text-sm">
                    Capacity {ferry.capacity} · ${ferry.price}/seat
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedFerryId !== null ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-base-color">
            Departure schedule
          </label>
          {loadingSchedules ? (
            <p className="text-muted text-sm">Loading schedules…</p>
          ) : bookableSchedules.length === 0 ? (
            <p className="text-muted text-sm">
              No scheduled crossings are currently published.
            </p>
          ) : (
            <div className="border-base overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-base text-muted text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2">Departure Date</th>
                    <th className="px-3 py-2">Departure Time</th>
                    <th className="px-3 py-2">Arrival Date</th>
                    <th className="px-3 py-2">Arrival Time</th>
                    <th className="px-3 py-2">Route</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {bookableSchedules.map((s) => {
                    const active = selectedScheduleId === s.id;
                    return (
                      <tr
                        key={s.id}
                        className={`border-base border-t ${
                          active ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="px-3 py-2">
                          {formatDateDdMmYyyy(s.travel_date)}
                        </td>
                        <td className="px-3 py-2">{s.departure_time}</td>
                        <td className="px-3 py-2">
                          {formatDateDdMmYyyy(s.arrival_date)}
                        </td>
                        <td className="px-3 py-2">
                          {s.arrival_time}
                        </td>
                        <td className="px-3 py-2">
                          {s.departure_port} → {s.arrival_port}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedScheduleId(s.id)}
                            className={
                              active
                                ? "text-sm font-semibold text-primary"
                                : "text-sm font-semibold text-primary hover:underline"
                            }
                            aria-pressed={active}
                          >
                            {active ? "Selected" : "Select"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      <div className="max-w-xs">
        <label
          htmlFor="ferry-passengers"
          className="block text-sm font-medium text-base-color"
        >
          Passengers
        </label>
        <Input
          id="ferry-passengers"
          type="number"
          min={1}
          max={selectedFerry?.capacity ?? 100}
          className="mt-2"
          value={passengers}
          onChange={(e) => setPassengers(Number(e.target.value))}
        />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={handleConfirm}>
          {cart.ferry ? "Update ferry booking" : "Confirm ferry booking"}
        </button>
        {cart.ferry ? (
          <button
            type="button"
            className="text-sm font-semibold text-danger hover:opacity-80"
            onClick={() => setFerry(null)}
          >
            Clear ferry booking
          </button>
        ) : null}
      </div>
    </section>
  );
}
