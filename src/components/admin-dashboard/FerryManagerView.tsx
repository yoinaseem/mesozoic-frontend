"use client";

import { CalendarRange, Sailboat, Users } from "lucide-react";

import { StatTile } from "@/components/dashboard/StatTile";
import { CapacityHeatmap } from "@/components/admin-dashboard/CapacityHeatmap";
import { Next7DaysChart } from "@/components/admin-dashboard/Next7DaysChart";
import { RecentActivityFeed } from "@/components/admin-dashboard/RecentActivityFeed";
import {
  deriveBookingsNext7Days,
  deriveFerryCapacityHeatmap,
  deriveRecentActivity,
  type AdminSnapshot,
} from "@/lib/admin-dashboard";

type Props = {
  snapshot: AdminSnapshot;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FerryManagerView({ snapshot }: Props) {
  const today = todayIso();

  const todayCrossings = snapshot.ferryBookings.filter(
    (b) => b.status === "confirmed" && b.travel_date === today,
  ).length;
  const todayPassengers = snapshot.ferryBookings.reduce(
    (acc, b) =>
      b.status === "confirmed" && b.travel_date === today ? acc + b.guests : acc,
    0,
  );
  const next7 = deriveBookingsNext7Days(
    snapshot.ferryBookings,
    (b) => b.travel_date,
  );
  const heatmap = deriveFerryCapacityHeatmap(snapshot);
  const recentActivity = deriveRecentActivity(snapshot, 10).filter(
    (i) => i.type === "ferry",
  );

  const totalSlots = snapshot.ferries.reduce(
    (acc, f) => acc + (f.schedules?.length ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Crossings today"
          value={String(todayCrossings)}
          hint={`${todayPassengers} passengers`}
          icon={Sailboat}
          accent="primary"
        />
        <StatTile
          label="Bookings today"
          value={String(todayCrossings)}
          hint="Confirmed only"
          icon={Users}
        />
        <StatTile
          label="Active vessels"
          value={String(snapshot.ferries.length)}
          hint={`${totalSlots} published slots`}
        />
        <StatTile
          label="Next 7 days"
          value={String(next7.reduce((acc, d) => acc + d.count, 0))}
          hint="Confirmed crossings ahead"
          icon={CalendarRange}
        />
      </div>

      <Next7DaysChart
        data={next7}
        title="Crossings — next 7 days"
        subtitle="Confirmed crossings per date"
      />

      <CapacityHeatmap cells={heatmap} />

      <RecentActivityFeed
        items={recentActivity}
        title="Recent ferry bookings"
      />
    </div>
  );
}
