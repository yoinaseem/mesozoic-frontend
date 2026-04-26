"use client";

import { useBookingCart } from "@/context/booking-cart-context";

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-base-color text-right font-medium">{value}</span>
    </div>
  );
}

export function BookingSummary() {
  const { cart, canBook, hasAnyAddOn } = useBookingCart();

  return (
    <aside className="card space-y-5 lg:sticky lg:top-24">
      <header>
        <h3 className="text-lg font-semibold text-primary">Your trip</h3>
        <p className="text-muted text-sm">
          Review everything before sending the booking.
        </p>
      </header>

      <section className="space-y-2">
        <h4 className="text-base-color text-sm font-semibold">Room</h4>
        {cart.room ? (
          <div className="space-y-1">
            <Line label="Hotel" value={cart.room.hotel.name} />
            <Line label="Type" value={cart.room.roomType.name} />
            <Line label="Room" value={cart.room.room.room_no} />
            <Line
              label="Dates"
              value={`${cart.room.checkIn} → ${cart.room.checkOut}`}
            />
            <Line label="Guests" value={`${cart.room.guests}`} />
          </div>
        ) : (
          <p className="text-muted text-sm">Not selected</p>
        )}
      </section>

      {cart.ferry ? (
        // TODO(DESD-100): the ferry summary needs the customer-picked
        // travel_date once the customer FerryStep is re-implemented around the
        // (slot, date) booking shape. Slots no longer carry per-trip dates.
        <section className="space-y-2">
          <h4 className="text-base-color text-sm font-semibold">Ferry</h4>
          <Line label="Ferry" value={cart.ferry.ferry.name} />
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
            value={`${cart.parkActivity.schedule.date ?? "—"} · ${
              cart.parkActivity.schedule.start_time ?? "—"
            }`}
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

      <div className="border-base border-t pt-4">
        <button
          type="button"
          className="btn-accent w-full"
          disabled={!canBook}
          title={
            canBook ? undefined : "Confirm a room before sending the booking."
          }
        >
          Review &amp; book
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
