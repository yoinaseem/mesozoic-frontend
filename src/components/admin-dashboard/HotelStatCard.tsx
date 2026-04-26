import { Bed, CalendarArrowDown, CalendarArrowUp, Wallet } from "lucide-react";

import { formatMoney, type HotelStats } from "@/lib/admin-dashboard";

type Props = {
  stats: HotelStats;
};

function pct(occupancy: NonNullable<HotelStats["occupancyToday"]>): string {
  if (occupancy.total === 0) return "—";
  return `${Math.round((occupancy.booked / occupancy.total) * 100)}%`;
}

export function HotelStatCard({ stats }: Props) {
  const occ = stats.occupancyToday;

  return (
    <article className="border-base bg-surface flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-primary text-lg font-bold">{stats.name}</h4>
        <p className="text-muted text-xs">
          {stats.activeReservations} active reservation
          {stats.activeReservations === 1 ? "" : "s"}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-base bg-base/40 flex items-center gap-3 rounded-lg border p-3">
          <Bed className="text-primary size-5" aria-hidden />
          <div>
            <p className="text-muted text-xs uppercase tracking-wide">
              Today&rsquo;s occupancy
            </p>
            <p className="text-base-color font-semibold">
              {occ ? `${occ.booked}/${occ.total} (${pct(occ)})` : "—"}
            </p>
          </div>
        </div>
        <div className="border-base bg-base/40 flex items-center gap-3 rounded-lg border p-3">
          <Wallet className="text-primary size-5" aria-hidden />
          <div>
            <p className="text-muted text-xs uppercase tracking-wide">
              Revenue (12 mo)
            </p>
            <p className="text-base-color font-semibold">
              {formatMoney(stats.revenue12mo)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <h5 className="text-base-color flex items-center gap-2 text-sm font-semibold">
            <CalendarArrowDown
              className="text-primary size-4"
              aria-hidden
            />
            Today&rsquo;s check-ins ({stats.checkInsToday.length})
          </h5>
          {stats.checkInsToday.length === 0 ? (
            <p className="text-muted mt-1 text-xs">None.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-xs">
              {stats.checkInsToday.slice(0, 5).map((rb) => (
                <li key={rb.id} className="text-muted">
                  Room {rb.room?.room_no ?? "?"} ·{" "}
                  {rb.room_type?.name ?? "—"} · {rb.guests} guest
                  {rb.guests === 1 ? "" : "s"}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h5 className="text-base-color flex items-center gap-2 text-sm font-semibold">
            <CalendarArrowUp
              className="text-primary size-4"
              aria-hidden
            />
            Today&rsquo;s check-outs ({stats.checkOutsToday.length})
          </h5>
          {stats.checkOutsToday.length === 0 ? (
            <p className="text-muted mt-1 text-xs">None.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-xs">
              {stats.checkOutsToday.slice(0, 5).map((rb) => (
                <li key={rb.id} className="text-muted">
                  Room {rb.room?.room_no ?? "?"} ·{" "}
                  {rb.room_type?.name ?? "—"} · {rb.guests} guest
                  {rb.guests === 1 ? "" : "s"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
