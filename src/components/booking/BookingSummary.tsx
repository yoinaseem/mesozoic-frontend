"use client";

import { ShoppingBag, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { useBookingCart } from "@/context/booking-cart-context";

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-base-color text-right font-medium">{value}</span>
    </div>
  );
}

// Shared remove button used on staged items in the sidebar. Existing
// items (rooms with existingId, anything in "Already on this trip") are
// rendered without it because they're already paid for / confirmed and
// can't be cleared from the cart.
function RemoveBtn({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-muted hover:text-danger flex size-6 shrink-0 items-center justify-center rounded-md transition-colors"
      aria-label={label}
      title={label}
    >
      <X className="size-4" aria-hidden />
    </button>
  );
}

export function BookingSummary() {
  const router = useRouter();
  const {
    cart,
    canBook,
    hasAnyAddOn,
    hasStagedItems,
    existingBookings,
    roomAlreadyExists,
    removeRoom,
    removeFerry,
    removeParkTicket,
    removeParkActivity,
    removeBeachActivity,
  } = useBookingCart();

  const hasExisting =
    existingBookings.parkBookings.length > 0 ||
    existingBookings.beachBookings.length > 0 ||
    existingBookings.parkActivityBookings.length > 0 ||
    existingBookings.ferryBookings.length > 0;

  const stagedCount =
    cart.rooms.filter((r) => r.existingId === undefined).length +
    cart.ferries.length +
    cart.parkTickets.length +
    cart.parkActivities.length +
    cart.beachActivities.length;

  const handleProceed = () => {
    router.push("/book/checkout");
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
                className="flex items-start justify-between gap-2"
              >
                <div className="min-w-0 flex-1 space-y-1">
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
                </div>
                {room.existingId === undefined ? (
                  <RemoveBtn
                    onClick={() => removeRoom(idx)}
                    label="Remove room from cart"
                  />
                ) : null}
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

      {cart.ferries.length > 0 ? (
        <section className="space-y-3">
          <h4 className="text-base-color text-sm font-semibold">
            {cart.ferries.length > 1 ? "Ferries" : "Ferry"}
          </h4>
          {cart.ferries.map((f, idx) => (
            <div
              key={`fc-${f.schedule.id}-${f.travelDate}-${idx}`}
              className="flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Line label="Ferry" value={f.ferry.name} />
                <Line label="Travel date" value={f.travelDate} />
                <Line
                  label="Departure Time"
                  value={f.schedule.departure_time}
                />
                <Line label="Arrival Time" value={f.schedule.arrival_time} />
                <Line
                  label="Route"
                  value={`${f.schedule.departure_port} → ${f.schedule.arrival_port}`}
                />
                <Line label="Passengers" value={`${f.passengers}`} />
              </div>
              <RemoveBtn
                onClick={() => removeFerry(idx)}
                label="Remove ferry from cart"
              />
            </div>
          ))}
        </section>
      ) : null}

      {cart.parkTickets.length > 0 ? (
        <section className="space-y-3">
          <h4 className="text-base-color text-sm font-semibold">
            {cart.parkTickets.length > 1 ? "Park tickets" : "Park ticket"}
          </h4>
          {cart.parkTickets.map((ticket, idx) => (
            <div
              key={`pt-${ticket.park.id}-${ticket.visitDate}-${idx}`}
              className="flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Line label="Park" value={ticket.park.name} />
                <Line label="Date" value={ticket.visitDate} />
                <Line label="Guests" value={`${ticket.guests}`} />
              </div>
              <RemoveBtn
                onClick={() => removeParkTicket(idx)}
                label="Remove park ticket from cart"
              />
            </div>
          ))}
        </section>
      ) : null}

      {cart.parkActivities.length > 0 ? (
        <section className="space-y-3">
          <h4 className="text-base-color text-sm font-semibold">
            {cart.parkActivities.length > 1
              ? "Park activities"
              : "Park activity"}
          </h4>
          {cart.parkActivities.map((act, idx) => (
            <div
              key={`pa-${act.activity.id}-${act.schedule?.id ?? act.date ?? ""}-${idx}`}
              className="flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Line label="Activity" value={act.activity.name} />
                <Line
                  label="When"
                  value={
                    act.schedule
                      ? `${act.schedule.date} · ${act.schedule.start_time}`
                      : `${act.date ?? "—"} · all day`
                  }
                />
                <Line label="Guests" value={`${act.guests}`} />
              </div>
              <RemoveBtn
                onClick={() => removeParkActivity(idx)}
                label="Remove park activity from cart"
              />
            </div>
          ))}
        </section>
      ) : null}

      {cart.beachActivities.length > 0 ? (
        <section className="space-y-3">
          <h4 className="text-base-color text-sm font-semibold">
            {cart.beachActivities.length > 1
              ? "Beach activities"
              : "Beach activity"}
          </h4>
          {cart.beachActivities.map((act, idx) => (
            <div
              key={`ba-${act.schedule.id}-${idx}`}
              className="flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Line label="Activity" value={act.activity.name} />
                <Line
                  label="When"
                  value={`${act.schedule.activity_date} · ${act.schedule.start_time}`}
                />
                <Line label="Guests" value={`${act.guests}`} />
              </div>
              <RemoveBtn
                onClick={() => removeBeachActivity(idx)}
                label="Remove beach activity from cart"
              />
            </div>
          ))}
        </section>
      ) : null}

      <div className="border-base border-t pt-4">
        <button
          type="button"
          className="btn-accent inline-flex w-full items-center justify-center gap-2"
          disabled={!canBook || !hasStagedItems}
          onClick={handleProceed}
          title={
            canBook ? undefined : "Add a room before proceeding to checkout."
          }
        >
          <ShoppingBag className="size-4" aria-hidden />
          {stagedCount > 0
            ? `Proceed to checkout · ${stagedCount} item${stagedCount === 1 ? "" : "s"}`
            : "Proceed to checkout"}
        </button>
        {!canBook ? (
          <p className="text-muted mt-2 text-center text-xs">
            Add a room to enable checkout.
          </p>
        ) : !hasAnyAddOn && cart.rooms.every((r) => r.existingId !== undefined) ? (
          <p className="text-muted mt-2 text-center text-xs">
            Add at least one item before checking out.
          </p>
        ) : !hasAnyAddOn ? (
          <p className="text-muted mt-2 text-center text-xs">
            Add-ons are optional — you can check out with the room alone.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
