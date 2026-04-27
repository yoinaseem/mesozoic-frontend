"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
    addFerry,
    removeFerry,
    clearFerries,
    existingBookings,
    primaryRoom,
    tripWindow,
    hasNextStep,
    registerStepCommitter,
  } = useBookingCart();

  const [ferries, setFerries] = useState<Ferry[]>([]);
  const [loadingFerries, setLoadingFerries] = useState(true);
  const [selectedFerryId, setSelectedFerryId] = useState<number | null>(null);

  const [schedules, setSchedules] = useState<FerrySchedule[]>([]);
  // Loading is derived from a "loadedFor" tracker — when the user picks a
  // new ferry the tracker still holds the previous id, so we render
  // "Loading…" until the new fetch lands and updates it.
  const [schedulesLoadedFor, setSchedulesLoadedFor] = useState<number | null>(
    null,
  );
  const loadingSchedules =
    selectedFerryId !== null && schedulesLoadedFor !== selectedFerryId;
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );

  const [travelDate, setTravelDate] = useState<string>(
    tripWindow?.checkIn ?? "",
  );

  const [passengers, setPassengers] = useState<number>(
    primaryRoom?.guests ?? 1,
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
    const ferryId = selectedFerryId;
    listFerrySchedules(ferryId)
      .then((res) => {
        if (cancelled) return;
        setSchedules(res.data);
        setSchedulesLoadedFor(ferryId);
      })
      .catch(() => {
        if (cancelled) return;
        setSchedulesLoadedFor(ferryId);
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

  // Schedule slots already taken by another staged ferry on the same
  // travel date — server enforces uniqueness on (reservation, schedule,
  // travel_date), so we mirror that client-side to prevent duplicate-add.
  const stagedKeys = useMemo(() => {
    return new Set(
      cart.ferries.map((f) => `${f.schedule.id}|${f.travelDate}`),
    );
  }, [cart.ferries]);

  const resetForm = () => {
    setSelectedFerryId(null);
    setSelectedScheduleId(null);
    setTravelDate(tripWindow?.checkIn ?? "");
    setPassengers(primaryRoom?.guests ?? 1);
    setError(null);
  };

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
        `Ferry passengers (${passengers}) exceed your room seat pool on ${travelDate} (${pool}).`,
      );
      return false;
    }
    const key = `${selectedSchedule.id}|${travelDate}`;
    if (stagedKeys.has(key)) {
      setError(
        "You already have this crossing in your cart for this date.",
      );
      return false;
    }
    if (existingBookings.ferryScheduleDates.has(key)) {
      setError(
        "Your existing trip already has a ferry on this slot for this date.",
      );
      return false;
    }
    addFerry({
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

  // Refs for scroll-on-change UX.
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
      if (cart.ferries.length > 0) return true;
      return commitSelection();
    }
    if (!commitSelection()) return false;
    resetForm();
    return true;
  };

  // Tab-navigation commit shim — wrap the latest closure in a ref so the
  // registered fn keeps seeing fresh form state. Ref assignment happens
  // in an effect to satisfy the react-hooks/refs rule.
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
    registerStepCommitter("ferry", () => tryCommitRef.current());
    return () => registerStepCommitter("ferry", null);
  }, [registerStepCommitter]);

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">Ferry booking</h2>
        <p className="text-muted text-sm">
          Pick a ferry, the departure slot, and the day you want to cross.
          Add as many crossings as you like across your stay.
        </p>
      </header>

      {cart.ferries.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-base-color text-sm font-semibold">
            Ferries in your cart
          </h3>
          <ul className="border-base divide-base divide-y rounded-lg border">
            {cart.ferries.map((f, index) => (
              <li
                key={`${f.schedule.id}-${f.travelDate}-${index}`}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="space-y-0.5 text-sm">
                  <p className="text-primary font-semibold">{f.ferry.name}</p>
                  <p className="text-muted">
                    {f.travelDate} · {f.schedule.departure_time} →{" "}
                    {f.schedule.arrival_time}
                    {f.schedule.departure_port
                      ? ` · ${f.schedule.departure_port} → ${f.schedule.arrival_port}`
                      : ""}
                    {" · "}
                    {f.passengers} passenger{f.passengers === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFerry(index)}
                  className="text-muted hover:text-danger flex items-center gap-1 text-xs font-semibold"
                  aria-label="Remove ferry"
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
          {cart.ferries.length === 0 ? "Pick a ferry" : "Add another crossing"}
        </h3>
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
                    // Toggle: clicking the active tile deselects.
                    if (active) {
                      setSelectedFerryId(null);
                      setSelectedScheduleId(null);
                      return;
                    }
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
                    // Disable schedules already staged for the current
                    // travelDate — duplicate (schedule_id, date) blocks
                    // server-side, so prevent the add at the picker level.
                    const stagedHere = stagedKeys.has(
                      `${s.id}|${travelDate}`,
                    );
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
                            disabled={stagedHere}
                            onClick={() => setSelectedScheduleId(s.id)}
                            className={
                              stagedHere
                                ? "text-muted cursor-not-allowed text-sm font-semibold"
                                : active
                                ? "text-sm font-semibold text-primary"
                                : "text-sm font-semibold text-primary hover:underline"
                            }
                            aria-pressed={active}
                          >
                            {stagedHere
                              ? "In your cart"
                              : active
                              ? "Selected"
                              : "Select"}
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
          {cart.ferries.length === 0 ? "Save crossing" : "Save & add another"}
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
          cart.ferries.length > 0 ? (
            <button
              type="button"
              className="text-sm font-semibold text-danger hover:opacity-80"
              onClick={clearFerries}
            >
              Clear all ferries
            </button>
          ) : null
        }
      />
    </section>
  );
}
