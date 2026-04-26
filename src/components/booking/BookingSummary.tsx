"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  type SubmitResult,
  type SubmitStep,
  useBookingCart,
} from "@/context/booking-cart-context";

const STEP_LABELS: Record<SubmitStep, string> = {
  room: "Room",
  "park-ticket": "Theme park ticket",
  "park-activity": "Park activity",
  "beach-activity": "Beach activity",
  ferry: "Ferry",
};

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-base-color text-right font-medium">{value}</span>
    </div>
  );
}

export function BookingSummary() {
  const router = useRouter();
  const {
    cart,
    canBook,
    hasAnyAddOn,
    submitting,
    submitCart,
    reset,
    existingBookings,
    roomAlreadyExists,
  } = useBookingCart();

  const hasExisting =
    existingBookings.parkBookings.length > 0 ||
    existingBookings.beachBookings.length > 0 ||
    existingBookings.parkActivityBookings.length > 0 ||
    existingBookings.ferryBookings.length > 0;

  const [lastResult, setLastResult] = useState<SubmitResult | null>(null);

  const handleSubmit = async () => {
    setLastResult(null);
    const result = await submitCart();
    setLastResult(result);

    if (result.errors.length === 0 && result.reservationId !== null) {
      toast.success("Trip booked. Check your dashboard for the details.");
      reset();
      router.push("/dashboard");
      return;
    }

    // The room bookings are the foundation — if no reservation_id was
    // resolved, nothing else ran. Otherwise at least the trip exists and
    // one or more add-ons reported errors; surface a less-alarming
    // "partial" toast so the user knows what to fix.
    if (result.reservationId === null) {
      toast.error(
        result.errors[0]?.message ?? "Could not create the room booking.",
      );
    } else {
      toast.warning(
        `Trip saved, but ${result.errors.length} item(s) need attention.`,
      );
    }
  };

  return (
    <aside className="card space-y-5 lg:sticky lg:top-24">
      <header>
        <h3 className="text-lg font-semibold text-primary">Your trip</h3>
        <p className="text-muted text-sm">
          Review everything before sending the booking.
        </p>
      </header>

      <section className="space-y-2">
        <h4 className="text-base-color text-sm font-semibold">
          {cart.rooms.length > 1 ? "Rooms" : "Room"}
          {roomAlreadyExists ? (
            <span className="text-muted ml-2 text-xs font-normal">
              (anchored on existing trip)
            </span>
          ) : null}
        </h4>
        {cart.rooms.length === 0 ? (
          <p className="text-muted text-sm">Not selected</p>
        ) : (
          <ul className="space-y-3">
            {cart.rooms.map((room, idx) => (
              <li
                key={`${room.hotel.id}-${room.roomType.id}-${room.checkIn}-${idx}`}
                className="space-y-1"
              >
                <p className="text-primary text-sm font-semibold">
                  {room.hotel.name} · {room.roomType.name}
                  {room.existingId !== undefined ? (
                    <span className="text-muted ml-2 text-xs font-normal">
                      (existing)
                    </span>
                  ) : null}
                </p>
                <Line
                  label="Dates"
                  value={`${room.checkIn} → ${room.checkOut}`}
                />
                <Line label="Guests" value={`${room.guests}`} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {hasExisting ? (
        <section className="border-base bg-base/30 space-y-3 rounded-lg border border-dashed p-3">
          <h4 className="text-base-color text-sm font-semibold">
            Already on this trip
          </h4>
          {existingBookings.parkBookings.map((b) => (
            <div key={`pb-${b.id}`} className="space-y-0.5">
              <p className="text-base-color text-xs font-semibold">
                Park ticket
              </p>
              <Line
                label={b.park?.name ?? `Park #${b.park_id}`}
                value={`${b.date} · ${b.guests} guest${
                  b.guests === 1 ? "" : "s"
                }`}
              />
            </div>
          ))}
          {existingBookings.parkActivityBookings.map((b) => (
            <div key={`pab-${b.id}`} className="space-y-0.5">
              <p className="text-base-color text-xs font-semibold">
                Park activity
              </p>
              <Line
                label={b.schedule?.activity?.name ?? "Activity"}
                value={`${b.schedule?.date ?? "—"} · ${b.guests} guest${
                  b.guests === 1 ? "" : "s"
                }`}
              />
            </div>
          ))}
          {existingBookings.beachBookings.map((b) => (
            <div key={`bb-${b.id}`} className="space-y-0.5">
              <p className="text-base-color text-xs font-semibold">
                Beach activity
              </p>
              <Line
                label={b.schedule?.activity?.name ?? "Activity"}
                value={`${b.schedule?.activity_date ?? "—"} · ${
                  b.guests
                } guest${b.guests === 1 ? "" : "s"}`}
              />
            </div>
          ))}
          {existingBookings.ferryBookings.map((b) => (
            <div key={`fb-${b.id}`} className="space-y-0.5">
              <p className="text-base-color text-xs font-semibold">Ferry</p>
              <Line
                label={b.schedule?.ferry?.name ?? "Ferry"}
                value={`${b.travel_date} · ${b.guests} passenger${
                  b.guests === 1 ? "" : "s"
                }`}
              />
            </div>
          ))}
        </section>
      ) : null}

      {cart.ferry ? (
        <section className="space-y-2">
          <h4 className="text-base-color text-sm font-semibold">Ferry</h4>
          <Line label="Ferry" value={cart.ferry.ferry.name} />
          <Line label="Travel date" value={cart.ferry.travelDate} />
          <Line
            label="Departure Time"
            value={cart.ferry.schedule.departure_time}
          />
          <Line
            label="Arrival Time"
            value={cart.ferry.schedule.arrival_time}
          />
          <Line
            label="Route"
            value={`${cart.ferry.schedule.departure_port} → ${cart.ferry.schedule.arrival_port}`}
          />
          <Line label="Passengers" value={`${cart.ferry.passengers}`} />
        </section>
      ) : null}

      {cart.parkTicket ? (
        <section className="space-y-2">
          <h4 className="text-base-color text-sm font-semibold">Park ticket</h4>
          <Line label="Park" value={cart.parkTicket.park.name} />
          <Line label="Date" value={cart.parkTicket.visitDate} />
          <Line label="Guests" value={`${cart.parkTicket.guests}`} />
        </section>
      ) : null}

      {cart.parkActivity ? (
        <section className="space-y-2">
          <h4 className="text-base-color text-sm font-semibold">
            Park activity
          </h4>
          <Line label="Activity" value={cart.parkActivity.activity.name} />
          <Line
            label="When"
            value={
              cart.parkActivity.schedule
                ? `${cart.parkActivity.schedule.date} · ${cart.parkActivity.schedule.start_time}`
                : `${cart.parkActivity.date ?? "—"} · all day`
            }
          />
          <Line label="Guests" value={`${cart.parkActivity.guests}`} />
        </section>
      ) : null}

      {cart.beachActivity ? (
        <section className="space-y-2">
          <h4 className="text-base-color text-sm font-semibold">
            Beach activity
          </h4>
          <Line label="Activity" value={cart.beachActivity.activity.name} />
          <Line
            label="When"
            value={`${cart.beachActivity.schedule.activity_date} · ${cart.beachActivity.schedule.start_time}`}
          />
          <Line label="Guests" value={`${cart.beachActivity.guests}`} />
        </section>
      ) : null}

      {lastResult && lastResult.errors.length > 0 ? (
        <div className="border-danger/40 bg-danger/5 space-y-2 rounded-lg border p-3 text-sm">
          <p className="text-danger font-semibold">
            {lastResult.reservationId !== null
              ? "Some items could not be booked:"
              : "Booking failed:"}
          </p>
          <ul className="space-y-1.5">
            {lastResult.errors.map((err) => {
              const fieldEntries = Object.entries(err.fieldErrors);
              return (
                <li key={`${err.step}-${err.message}`} className="space-y-0.5">
                  <p className="text-base-color">
                    <span className="font-medium">
                      {STEP_LABELS[err.step]}:
                    </span>{" "}
                    {err.message}
                  </p>
                  {fieldEntries.length > 0 ? (
                    <ul className="text-muted ml-3 list-disc text-xs">
                      {fieldEntries.flatMap(([field, msgs]) =>
                        msgs.map((msg, i) => (
                          <li key={`${field}-${i}`}>
                            <span className="font-medium">{field}:</span> {msg}
                          </li>
                        )),
                      )}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="border-base border-t pt-4">
        <button
          type="button"
          className="btn-accent w-full"
          disabled={!canBook || submitting}
          onClick={handleSubmit}
          title={
            canBook ? undefined : "Confirm a room before sending the booking."
          }
        >
          {submitting ? "Sending booking…" : "Review & book"}
        </button>
        {!canBook ? (
          <p className="text-muted mt-2 text-center text-xs">
            Book a room to enable checkout.
          </p>
        ) : !hasAnyAddOn ? (
          <p className="text-muted mt-2 text-center text-xs">
            Add-ons are optional — you can book the room by itself.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
