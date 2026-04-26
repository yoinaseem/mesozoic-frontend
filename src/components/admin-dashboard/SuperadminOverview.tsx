"use client";

import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Compass,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { BookingMixChart } from "@/components/dashboard/BookingMixChart";
import { SpendOverTimeChart } from "@/components/dashboard/SpendOverTimeChart";
import { StatTile } from "@/components/dashboard/StatTile";
import { RecentActivityFeed } from "@/components/admin-dashboard/RecentActivityFeed";
import { SignupsOverTimeChart } from "@/components/admin-dashboard/SignupsOverTimeChart";
import { TopHotelsChart } from "@/components/admin-dashboard/TopHotelsChart";
import {
  deriveBookingMix,
  deriveRecentActivity,
  deriveRevenueByMonth,
  deriveSignupsByMonth,
  deriveSuperadminAggregates,
  deriveTopHotelsByRevenue,
  formatMoney,
  type AdminSnapshot,
} from "@/lib/admin-dashboard";

type Props = {
  snapshot: AdminSnapshot;
};

export function SuperadminOverview({ snapshot }: Props) {
  const aggregates = deriveSuperadminAggregates(snapshot);
  const revenueByMonth = deriveRevenueByMonth(snapshot);
  const bookingMix = deriveBookingMix(snapshot);
  const topHotels = deriveTopHotelsByRevenue(snapshot);
  const signupsByMonth = deriveSignupsByMonth(snapshot);
  const recentActivity = deriveRecentActivity(snapshot, 12);

  const cancellationRatePct = `${(aggregates.cancellationRate * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Lifetime revenue"
          value={formatMoney(aggregates.revenueLifetime)}
          hint={`Today ${formatMoney(aggregates.revenueToday)}`}
          icon={Wallet}
          accent="primary"
        />
        <StatTile
          label="Bookings this month"
          value={String(aggregates.bookingsThisMonth)}
          hint={`Today ${aggregates.bookingsToday} · Week ${aggregates.bookingsThisWeek}`}
          icon={CalendarRange}
        />
        <StatTile
          label="Active reservations"
          value={String(aggregates.activeReservations)}
          hint="Open trips on the books"
          icon={Compass}
        />
        <StatTile
          label="Cancellation rate"
          value={cancellationRatePct}
          hint={`${aggregates.cancelledLastWeek} cancelled in last 7 days`}
          icon={AlertTriangle}
          accent="muted"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SpendOverTimeChart data={revenueByMonth} />
        <BookingMixChart data={bookingMix} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopHotelsChart data={topHotels} />
        <SignupsOverTimeChart data={signupsByMonth} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <RecentActivityFeed
          items={recentActivity}
          title="Recent activity (all channels)"
        />
        <section className="border-base bg-surface flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
          <header className="flex items-center gap-2">
            <Activity className="text-primary size-4" aria-hidden />
            <h3 className="text-base-color text-base font-semibold">
              At a glance
            </h3>
          </header>
          <ul className="text-muted space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CalendarDays className="text-primary size-4" aria-hidden />
              <span>
                <span className="text-base-color font-semibold">
                  {aggregates.bookingsToday}
                </span>{" "}
                bookings created today
              </span>
            </li>
            <li className="flex items-center gap-2">
              <TrendingUp className="text-primary size-4" aria-hidden />
              <span>
                <span className="text-base-color font-semibold">
                  {formatMoney(aggregates.revenueThisMonth)}
                </span>{" "}
                revenue this month
              </span>
            </li>
            <li className="flex items-center gap-2">
              <AlertTriangle className="text-primary size-4" aria-hidden />
              <span>
                <span className="text-base-color font-semibold">
                  {aggregates.cancelledLastWeek}
                </span>{" "}
                cancellations last 7 days
              </span>
            </li>
          </ul>
          <p className="text-muted text-xs italic">
            Customer-initiated cancellation isn&rsquo;t tracked off-system.
            Numbers reflect staff cancellations on booking rows.
          </p>
        </section>
      </div>
    </div>
  );
}
