"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { StepNav } from "@/components/booking/StepNav";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import { listFerries, listFerrySchedules } from "@/lib/api/ferries";
import { seatPoolOn } from "@/lib/seat-pool";
import type { Ferry, FerrySchedule } from "@/types/booking";

export function FerryStep() {
  const {
    cart,
    setFerry,
    existingBookings,
    primaryRoom,
    tripWindow,
    hasNextStep,
  } = useBookingCart();

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

  const [travelDate, setTravelDate] = useState<string>(
    cart.ferry?.travelDate ?? tripWindow?.checkIn ?? "",
  );

  const [passengers, setPassengers] = useState<number>(
    cart.ferry?.passengers ?? primaryRoom?.guests ?? 1,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
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
    if (selectedFerryId === null) return;
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

  const selectedFerry = ferries.find((f) => f.id === selectedFerryId) ?? null;
  const selectedSchedule =
    schedules.find((s) => s.id === selectedScheduleId) ?? null;

  const ferryCapacity = selectedFerry?.ferry_type?.capacity ?? 0;

  // Ferries use ferrySeatPoolOn — inclusive of both check-in and check-out.
  const minTravelDate =
    tripWindow?.checkIn ?? new Date().toISOString().slice(0, 10);
  const maxTravelDate = tripWindow?.checkOut ?? "";
  const travelDateValid = useMemo(() => {
    if (!travelDate || !tripWindow) return false;
    return travelDate >= tripWindow.checkIn && travelDate <= tripWindow.checkOut;
  }, [travelDate, tripWindow]);

  const formIsTouched =
    selectedFerryId !== null ||
    selectedScheduleId !== null ||
    travelDate !== (tripWindow?.checkIn ?? "");

  const commitSelection = (): boolean => {
    setError(null);
    if (!selectedFerry || !selectedSchedule) {
      setError("Pick a ferry and a scheduled departure.");
      return false;
    }
    if (!travelDate) {
      setError("Pick a travel date for the crossing.");
      return false;
    }
    if (!travelDateValid) {
      setError(
        "Travel date must fall on or between your check-in and check-out.",
      );
      return false;
    }
    if (passengers < 1) {
      setError("At least one passenger is required.");
      return false;
    }
    if (ferryCapacity > 0 && passengers > ferryCapacity) {
      setError(`This ferry carries up to ${ferryCapacity} passengers.`);
      return false;
    }
    // Ferry uses the inclusive seat-pool helper — arrival- and
    // departure-day crossings are valid (§15).
    const pool = seatPoolOn(cart.rooms, travelDate, {
      exclusiveCheckout: false,
    });
    if (pool === 0) {
      setError(
        `No room covers ${travelDate} on this trip. Add a room that includes this date or pick a different travel date.`,
      );
      return false;
    }
    if (passengers > pool) {
      setError(
        `Ferry passengers (${passengers}) exceed your room seat pool on ${travelDate} (${pool}). Adjust the booking or add another room.`,
      );
      return false;
    }
    if (
      existingBookings.ferryScheduleDates.has(
        `${selectedSchedule.id}|${travelDate}`,
      )
    ) {
      setError(
        "Your existing trip already has a ferry on this slot for this date.",
      );
      return false;
    }
    setFerry({
      ferry: selectedFerry,
      schedule: selectedSchedule,
      travelDate,
      passengers,
    });
    toast.success(
      `Added to cart: ${selectedFerry.name} · ${travelDate} · ${passengers} passenger${passengers === 1 ? "" : "s"}`,
    );
    return true;
  };

  // Optional step — Next without form interaction just advances when
  // there's a later step. When this is the last reachable step the
  // button reads "Add to cart" and must always commit (or surface a
  // validation error) — see BeachActivityStep for the full reasoning.
  const handleNext = (): boolean => {
    if (hasNextStep && !formIsTouched && !cart.ferry) return true;
    return commitSelection();
  };

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">Ferry booking</h2>
        <p className="text-muted text-sm">
          Pick a ferry, the departure slot, and the day you want to cross.
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
                    {ferry.ferry_type
                      ? `Capacity ${ferry.ferry_type.capacity} · $${ferry.ferry_type.price}/seat`
                      : "Capacity / price unavailable"}
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
          ) : schedules.length === 0 ? (
            <p className="text-muted text-sm">
              No scheduled crossings are currently published.
            </p>
          ) : (
            <div className="border-base overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-base text-muted text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2">Departure Time</th>
                    <th className="px-3 py-2">Arrival Time</th>
                    <th className="px-3 py-2">Route</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => {
                    const active = selectedScheduleId === s.id;
                    return (
                      <tr
                        key={s.id}
                        className={`border-base border-t ${
                          active ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="px-3 py-2">{s.departure_time}</td>
                        <td className="px-3 py-2">{s.arrival_time}</td>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="ferry-date"
            className="block text-sm font-medium text-base-color"
          >
            Travel date
          </label>
          <DatePicker
            id="ferry-date"
            className="mt-2"
            min={minTravelDate}
            max={maxTravelDate || undefined}
            value={travelDate}
            onChange={setTravelDate}
            placeholder="Select travel date"
          />
          {tripWindow ? (
            <p className="text-muted mt-1 text-xs">
              Within your stay: {tripWindow.checkIn} – {tripWindow.checkOut}{" "}
              (inclusive).
            </p>
          ) : null}
        </div>
        <div>
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
            max={ferryCapacity || 100}
            className="mt-2"
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <StepNav
        onNext={handleNext}
        leadingActions={
          cart.ferry ? (
            <button
              type="button"
              className="text-sm font-semibold text-danger hover:opacity-80"
              onClick={() => setFerry(null)}
            >
              Clear ferry booking
            </button>
          ) : null
        }
      />
    </section>
  );
}
