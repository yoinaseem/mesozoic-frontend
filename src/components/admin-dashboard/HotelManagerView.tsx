"use client";

import { Bed, CalendarRange, Wallet } from "lucide-react";

import { SpendOverTimeChart } from "@/components/dashboard/SpendOverTimeChart";
import { StatTile } from "@/components/dashboard/StatTile";
import { HotelStatCard } from "@/components/admin-dashboard/HotelStatCard";
import { RecentActivityFeed } from "@/components/admin-dashboard/RecentActivityFeed";
import {
  deriveHotelStats,
  deriveRecentActivity,
  deriveRevenueByMonth,
  formatMoney,
  type AdminSnapshot,
} from "@/lib/admin-dashboard";

type Props = {
  snapshot: AdminSnapshot;
};

export function HotelManagerView({ snapshot }: Props) {
  const stats = deriveHotelStats(snapshot);
  const revenueByMonth = deriveRevenueByMonth(snapshot);
  const recentActivity = deriveRecentActivity(snapshot, 10).filter(
    (i) => i.type === "room",
  );

  const totalCheckInsToday = stats.reduce(
    (acc, s) => acc + s.checkInsToday.length,
    0,
  );
  const totalCheckOutsToday = stats.reduce(
    (acc, s) => acc + s.checkOutsToday.length,
    0,
  );
  const totalActive = stats.reduce((acc, s) => acc + s.activeReservations, 0);
  const totalRevenue = stats.reduce((acc, s) => acc + s.revenue12mo, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active reservations"
          value={String(totalActive)}
          hint={`Across ${stats.length} hotel${stats.length === 1 ? "" : "s"}`}
          icon={Bed}
          accent="primary"
        />
        <StatTile
          label="Check-ins today"
          value={String(totalCheckInsToday)}
          hint="Confirmed arrivals"
          icon={CalendarRange}
        />
        <StatTile
          label="Check-outs today"
          value={String(totalCheckOutsToday)}
          hint="Confirmed departures"
          icon={CalendarRange}
        />
        <StatTile
          label="Revenue (12 mo)"
          value={formatMoney(totalRevenue)}
          hint="Across managed hotels"
          icon={Wallet}
          accent="primary"
        />
      </div>

      {stats.length === 0 ? (
        <div className="border-base bg-surface rounded-xl border p-6 text-center text-sm">
          <p className="text-muted">
            You don&rsquo;t have any hotels assigned yet. Ask a superadmin to
            assign you to one or more hotels.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {stats.map((s) => (
            <HotelStatCard key={s.hotelId} stats={s} />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <SpendOverTimeChart data={revenueByMonth} />
        <RecentActivityFeed
          items={recentActivity}
          title="Recent room bookings"
        />
      </div>
    </div>
  );
}
