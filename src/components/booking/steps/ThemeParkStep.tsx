"use client";

import { useEffect, useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import { getEffectiveHours, listThemeParks } from "@/lib/api/theme-parks";
import type { EffectiveHour, ThemePark } from "@/types/booking";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Ticket modules use Reservation::seatPoolOn, which is exclusive on
// check-out — guests are leaving that day. Subtract one day to get the
// last bookable visit date.
//
// Parse + emit in UTC to avoid the local-timezone round-trip that
// `new Date("YYYY-MM-DD")` triggers: in a positive-offset timezone (e.g.
// Asia/Dubai), local-midnight serialises as the previous day in UTC, so
// `toISOString().slice(0, 10)` would lop an extra day off.
function previousDayIso(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
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
  const { cart, setParkTicket, existingBookings } = useBookingCart();
  const room = cart.room;
  const minVisitDate = room?.checkIn ?? todayIso();
  const maxVisitDate = room ? previousDayIso(room.checkOut) : undefined;

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
  const [hoursLoadedFor, setHoursLoadedFor] = useState<string | null>(null);
  const hoursKey =
    selectedParkId !== null && visitDate
      ? `${selectedParkId}|${visitDate}`
      : null;
  const loadingHours = hoursKey !== null && hoursLoadedFor !== hoursKey;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
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
    if (selectedParkId === null || !visitDate) return;
    let cancelled = false;
    const key = `${selectedParkId}|${visitDate}`;
    getEffectiveHours(selectedParkId, { date: visitDate })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res.data;
        setHours(list[0] ?? null);
        setHoursLoadedFor(key);
      })
      .catch(() => {
        if (cancelled) return;
        setHours(null);
        setHoursLoadedFor(key);
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
    if (room) {
      if (visitDate < room.checkIn || visitDate >= room.checkOut) {
        setError(
          "Visit date must fall on or after check-in and before check-out.",
        );
        return;
      }
    }
    if (existingBookings.parkDates.has(`${selectedPark.id}|${visitDate}`)) {
      setError(
        "Your existing trip already has a day-pass for this park on this date.",
      );
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
          <DatePicker
            id="park-date"
            className="mt-2"
            min={minVisitDate}
            max={maxVisitDate}
            value={visitDate}
            onChange={setVisitDate}
            placeholder="Select visit date"
          />
          {room ? (
            <p className="text-muted mt-1 text-xs">
              Within your stay: {room.checkIn} – {previousDayIso(room.checkOut)}{" "}
              (excludes check-out day).
            </p>
          ) : null}
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
