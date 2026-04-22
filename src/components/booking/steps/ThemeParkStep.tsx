"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import { getEffectiveHours, listThemeParks } from "@/lib/api/theme-parks";
import type { EffectiveHour, ThemePark } from "@/types/booking";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateDdMmYyyy(date: string): string {
  const dateOnly = date.split("T")[0];
  const parts = dateOnly.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return date;
}

export function ThemeParkStep() {
  const { cart, setParkTicket } = useBookingCart();

  const [parks, setParks] = useState<ThemePark[]>([]);
  const [loadingParks, setLoadingParks] = useState(true);
  const [selectedParkId, setSelectedParkId] = useState<number | null>(
    cart.parkTicket?.park.id ?? null,
  );

  const [visitDate, setVisitDate] = useState<string>(
    cart.parkTicket?.visitDate ?? cart.room?.checkIn ?? todayIso(),
  );
  const [guests, setGuests] = useState<number>(
    cart.parkTicket?.guests ?? cart.room?.guests ?? 1,
  );

  const [hours, setHours] = useState<EffectiveHour | null>(null);
  const [loadingHours, setLoadingHours] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingParks(true);
    listThemeParks()
      .then((res) => {
        if (cancelled) return;
        setParks(res.data);
        setLoadingParks(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadingParks(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedParkId === null || !visitDate) {
      setHours(null);
      return;
    }
    let cancelled = false;
    setLoadingHours(true);
    getEffectiveHours(selectedParkId, { date: visitDate })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res.data;
        setHours(list[0] ?? null);
        setLoadingHours(false);
      })
      .catch(() => {
        if (cancelled) return;
        setHours(null);
        setLoadingHours(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedParkId, visitDate]);

  const selectedPark = parks.find((p) => p.id === selectedParkId) ?? null;

  const handleConfirm = () => {
    setError(null);
    if (!selectedPark) {
      setError("Pick a theme park.");
      return;
    }
    if (!visitDate) {
      setError("Choose a visit date.");
      return;
    }
    if (hours && hours.status === "closed") {
      setError("The park is closed on this date. Pick another day.");
      return;
    }
    if (selectedPark.capacity !== null && guests > selectedPark.capacity) {
      setError(`Daily capacity is ${selectedPark.capacity} guests.`);
      return;
    }
    if (guests < 1) {
      setError("At least one guest is required.");
      return;
    }
    setParkTicket({ park: selectedPark, visitDate, guests });
  };

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">
          Theme park tickets
        </h2>
        <p className="text-muted text-sm">
          Reserve park tickets for a specific date. Individual park activities
          unlock once a ticket is in your cart.
        </p>
      </header>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-base-color">
          Theme park
        </label>
        {loadingParks ? (
          <p className="text-muted text-sm">Loading parks…</p>
        ) : parks.length === 0 ? (
          <p className="text-muted text-sm">No theme parks are listed yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {parks.map((park) => {
              const active = selectedParkId === park.id;
              return (
                <button
                  key={park.id}
                  type="button"
                  onClick={() => setSelectedParkId(park.id)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-base hover:border-primary"
                  }`}
                  aria-pressed={active}
                >
                  <p className="font-semibold text-primary">{park.name}</p>
                  <p className="text-muted mt-1 text-sm">
                    {park.price !== null ? `$${park.price}/ticket` : "Price on arrival"}
                    {park.capacity !== null ? ` · up to ${park.capacity}/day` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="park-date"
            className="block text-sm font-medium text-base-color"
          >
            Visit date
          </label>
          <Input
            id="park-date"
            type="date"
            min={todayIso()}
            className="mt-2"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="park-guests"
            className="block text-sm font-medium text-base-color"
          >
            Guests
          </label>
          <Input
            id="park-guests"
            type="number"
            min={1}
            max={selectedPark?.capacity ?? 50}
            className="mt-2"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          />
        </div>
      </div>

      {selectedParkId !== null ? (
        <p className="text-muted text-sm" role="status">
          {loadingHours
            ? "Checking opening hours…"
            : hours === null
            ? "No published hours for this date."
            : hours.status === "closed"
            ? `Closed on ${formatDateDdMmYyyy(hours.date)}${
                hours.note ? ` · ${hours.note}` : ""
              }.`
            : `Open ${hours.open_time ?? "—"} to ${
                hours.close_time ?? "—"
              } on ${formatDateDdMmYyyy(hours.date)}.`}
        </p>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={handleConfirm}>
          {cart.parkTicket ? "Update park ticket" : "Confirm park ticket"}
        </button>
        {cart.parkTicket ? (
          <button
            type="button"
            className="text-sm font-semibold text-danger hover:opacity-80"
            onClick={() => setParkTicket(null)}
          >
            Clear park ticket
          </button>
        ) : null}
      </div>
    </section>
  );
}
