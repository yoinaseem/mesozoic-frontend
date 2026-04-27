"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { StepNav } from "@/components/booking/StepNav";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { useBookingCart } from "@/context/booking-cart-context";
import { getEffectiveHours, listThemeParks } from "@/lib/api/theme-parks";
import { seatPoolOn } from "@/lib/seat-pool";
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
  const {
    cart,
    addParkTicket,
    removeParkTicket,
    clearParkTickets,
    existingBookings,
    primaryRoom,
    tripWindow,
    hasNextStep,
    registerStepCommitter,
  } = useBookingCart();
  const minVisitDate = tripWindow?.checkIn ?? todayIso();
  const maxVisitDate = tripWindow
    ? previousDayIso(tripWindow.checkOut)
    : undefined;

  const [parks, setParks] = useState<ThemePark[]>([]);
  const [loadingParks, setLoadingParks] = useState(true);
  const [selectedParkId, setSelectedParkId] = useState<number | null>(null);

  const [visitDate, setVisitDate] = useState<string>(
    tripWindow?.checkIn ?? todayIso(),
  );
  const [guests, setGuests] = useState<number>(primaryRoom?.guests ?? 1);

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

  const formIsTouched = selectedParkId !== null;

  const resetForm = () => {
    setSelectedParkId(null);
    setVisitDate(tripWindow?.checkIn ?? todayIso());
    setGuests(primaryRoom?.guests ?? 1);
    setHours(null);
    setHoursLoadedFor(null);
    setError(null);
  };

  const commitSelection = (): boolean => {
    setError(null);
    if (!selectedPark) {
      setError("Pick a theme park.");
      return false;
    }
    if (!visitDate) {
      setError("Choose a visit date.");
      return false;
    }
    if (hours && hours.status === "closed") {
      setError("The park is closed on this date. Pick another day.");
      return false;
    }
    if (tripWindow) {
      if (visitDate < tripWindow.checkIn || visitDate >= tripWindow.checkOut) {
        setError(
          "Visit date must fall on or after check-in and before check-out.",
        );
        return false;
      }
    }
    // Duplicate check across both staged AND already-confirmed tickets:
    // booking the same (park, date) pair twice is always a 422 server-side.
    const stagedDup = cart.parkTickets.some(
      (t) => t.park.id === selectedPark.id && t.visitDate === visitDate,
    );
    if (stagedDup) {
      setError(
        "You already have a day-pass for this park on this date in your cart.",
      );
      return false;
    }
    if (existingBookings.parkDates.has(`${selectedPark.id}|${visitDate}`)) {
      setError(
        "Your existing trip already has a day-pass for this park on this date.",
      );
      return false;
    }
    if (selectedPark.capacity !== null && guests > selectedPark.capacity) {
      setError(`Daily capacity is ${selectedPark.capacity} guests.`);
      return false;
    }
    if (guests < 1) {
      setError("At least one guest is required.");
      return false;
    }
    // Reservation seat pool — guests must fit inside the sum of confirmed
    // room guests covering this date. API §12 enforces the same rule and
    // would 422 on `errors.guests`; we surface it here so the customer
    // doesn't learn about it at checkout.
    const pool = seatPoolOn(cart.rooms, visitDate);
    if (pool === 0) {
      setError(
        `No room covers ${visitDate} on this trip. Add a room that includes this date or pick a different visit date.`,
      );
      return false;
    }
    if (guests > pool) {
      setError(
        `Park ticket guests (${guests}) exceed your room seat pool on ${visitDate} (${pool}). Adjust the ticket or add another room.`,
      );
      return false;
    }
    addParkTicket({ park: selectedPark, visitDate, guests });
    toast.success(
      `Added to cart: ${selectedPark.name} · ${visitDate} · ${guests} guest${guests === 1 ? "" : "s"}`,
    );
    return true;
  };

  // Refs for scroll-on-change UX. After a successful add we scroll the
  // form heading into view so the customer can SEE the form has reset
  // (otherwise the cleared inputs sit below the fold and feel like the
  // click did nothing). On a new error message we scroll the error into
  // view so it isn't hidden below the inputs.
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

  // Add another ticket — commit the form and reset for a new entry.
  // Doesn't navigate; the customer keeps adding until they pick Next.
  const handleAddAnother = () => {
    if (commitSelection()) {
      resetForm();
      formHeadingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Next: when the form has data, commit it before advancing. We return
  // the explicit "park-activity" target so navigation lands on the now-
  // unlocked activity step instead of skipping to beach (the default
  // goToNextStep would still see the pre-commit cart and treat
  // park-activity as locked).
  const handleNext = () => {
    if (formIsTouched) {
      if (!commitSelection()) return false as const;
      resetForm();
      return "park-activity" as const;
    }
    if (cart.parkTickets.length > 0) {
      return "park-activity" as const;
    }
    // Untouched form on a non-last step = "skip this optional step".
    if (hasNextStep) return true as const;
    // Last reachable step → require validation feedback.
    return commitSelection();
  };

  // Tab-navigation auto-commit. Untouched form: no-op true. Touched:
  // commit (validates first; failure blocks navigation with the same
  // error message). Ref assignment lives in an effect (no deps) — the
  // react-hooks/refs rule bans ref writes during render.
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
    registerStepCommitter("park-ticket", () => tryCommitRef.current());
    return () => registerStepCommitter("park-ticket", null);
  }, [registerStepCommitter]);

  return (
    <section className="card space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-primary">
          Theme park tickets
        </h2>
        <p className="text-muted text-sm">
          Reserve park tickets for specific dates. Add as many as you like —
          park activities unlock once at least one ticket is in your cart.
        </p>
      </header>

      {cart.parkTickets.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-base-color text-sm font-semibold">
            Park tickets in your cart
          </h3>
          <ul className="border-base divide-base divide-y rounded-lg border">
            {cart.parkTickets.map((ticket, index) => (
              <li
                key={`${ticket.park.id}-${ticket.visitDate}-${index}`}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="space-y-0.5 text-sm">
                  <p className="text-primary font-semibold">
                    {ticket.park.name}
                  </p>
                  <p className="text-muted">
                    {ticket.visitDate} · {ticket.guests} guest
                    {ticket.guests === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeParkTicket(index)}
                  className="text-muted hover:text-danger flex items-center gap-1 text-xs font-semibold"
                  aria-label="Remove park ticket"
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
          {cart.parkTickets.length === 0
            ? "Pick a theme park"
            : "Add another ticket"}
        </h3>
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
                  onClick={() =>
                    setSelectedParkId(active ? null : park.id)
                  }
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
          {tripWindow ? (
            <p className="text-muted mt-1 text-xs">
              Within your stay: {tripWindow.checkIn} – {previousDayIso(tripWindow.checkOut)}{" "}
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

      {error ? (
        <p
          ref={errorRef}
          className="scroll-mt-24 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {/* Save & add another — prominent inline button that commits the
          current form and gives the customer a fresh form to enter the
          next ticket without leaving the step. Lives in the form area
          (not the StepNav footer) so it reads as a form action rather
          than navigation. */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={handleAddAnother}
        >
          <Plus className="size-4" aria-hidden />
          {cart.parkTickets.length === 0
            ? "Save ticket"
            : "Save & add another"}
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
          cart.parkTickets.length > 0 ? (
            <button
              type="button"
              className="text-sm font-semibold text-danger hover:opacity-80"
              onClick={clearParkTickets}
            >
              Clear all tickets
            </button>
          ) : null
        }
      />
    </section>
  );
}
