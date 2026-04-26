import {
  computeBookingsSummary,
  computeReservationTotal,
  deriveReservationStatus,
  reservationDateRange,
  type CustomerSnapshot,
  type ReservationStatus,
} from "@/lib/customer-dashboard";
import type { Reservation } from "@/types/booking";

type Props = {
  reservation: Reservation;
  snapshot: CustomerSnapshot;
};

const STATUS_STYLES: Record<ReservationStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const STATUS_LABELS: Record<ReservationStatus, string> = {
  active: "Active",
  partial: "Partial",
  cancelled: "Cancelled",
};

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function TripCard({ reservation, snapshot }: Props) {
  const status = deriveReservationStatus(reservation);
  const range = reservationDateRange(reservation);
  const summary = computeBookingsSummary(reservation, snapshot);
  const total = computeReservationTotal(reservation, snapshot);

  const summaryEntries = (
    [
      ["Rooms", summary.rooms],
      ["Park", summary.park],
      ["Beach", summary.beach],
      ["Activity", summary.activity],
      ["Ferry", summary.ferry],
    ] as Array<[string, number]>
  ).filter(([, count]) => count > 0);

  return (
    <article className="border-base bg-surface flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted text-xs font-semibold uppercase tracking-wider">
            Trip #{reservation.id}
          </p>
          <h4 className="text-primary mt-1 text-lg font-bold">
            {range
              ? `${range.checkIn} → ${range.checkOut}`
              : "No confirmed dates"}
          </h4>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </header>

      {summaryEntries.length === 0 ? (
        <p className="text-muted text-sm">No confirmed bookings on this trip.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {summaryEntries.map(([label, count]) => (
            <li
              key={label}
              className="border-base bg-base/40 text-base-color rounded-md border px-2.5 py-1 text-xs"
            >
              <span className="font-semibold">{count}</span>{" "}
              <span className="text-muted">{label}</span>
            </li>
          ))}
        </ul>
      )}

      <footer className="border-base flex items-baseline justify-between border-t pt-3">
        <p className="text-muted text-xs">
          Estimated total {/* "estimated" because cancelled rows still carry
          their original total_price — see Chris's note (#14). */}
        </p>
        <p className="text-primary text-base font-bold">{formatMoney(total)}</p>
      </footer>
    </article>
  );
}
