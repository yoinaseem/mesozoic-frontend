"use client";

import { CalendarClock, CalendarRange, Waves } from "lucide-react";

import { StatTile } from "@/components/dashboard/StatTile";
import { Next7DaysChart } from "@/components/admin-dashboard/Next7DaysChart";
import { RecentActivityFeed } from "@/components/admin-dashboard/RecentActivityFeed";
import { TopActivitiesList } from "@/components/admin-dashboard/TopActivitiesList";
import {
  deriveBookingsNext7Days,
  deriveRecentActivity,
  deriveTopBeachActivities,
  type AdminSnapshot,
} from "@/lib/admin-dashboard";

type Props = {
  snapshot: AdminSnapshot;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BeachManagerView({ snapshot }: Props) {
  const today = todayIso();

  const bookingsToday = snapshot.beachBookings.filter(
    (b) =>
      b.status === "confirmed" && (b.schedule?.activity_date ?? "") === today,
  ).length;

  const next7 = deriveBookingsNext7Days(
    snapshot.beachBookings,
    (b) => b.schedule?.activity_date ?? "",
  );
  const upcomingWeekTotal = next7.reduce((acc, d) => acc + d.count, 0);

  const topActivities = deriveTopBeachActivities(snapshot);
  const recentActivity = deriveRecentActivity(snapshot, 10).filter(
    (i) => i.type === "beach",
  );

  const totalSchedules = snapshot.beachActivities.reduce(
    (acc, a) => acc + (a.schedules_count ?? a.schedules?.length ?? 0),
    0,
  );
  const totalConfirmedBookings = snapshot.beachBookings.filter(
    (b) => b.status === "confirmed",
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Bookings today"
          value={String(bookingsToday)}
          hint="Confirmed beach sessions"
          icon={Waves}
          accent="primary"
        />
        <StatTile
          label="Next 7 days"
          value={String(upcomingWeekTotal)}
          hint="Confirmed sessions ahead"
          icon={CalendarRange}
        />
        <StatTile
          label="Activities"
          value={String(snapshot.beachActivities.length)}
          hint="Published catalogue entries"
        />
        <StatTile
          label="Schedules"
          value={String(totalSchedules)}
          hint="Active session slots"
          icon={CalendarClock}
        />
        <StatTile
          label="Confirmed bookings"
          value={String(totalConfirmedBookings)}
          hint="Lifetime, all activities"
          accent="primary"
        />
        <StatTile
          label="Top activity"
          value={topActivities[0]?.name ?? "—"}
          hint={
            topActivities[0]
              ? `${topActivities[0].count} bookings lifetime`
              : "No bookings yet"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Next7DaysChart
          data={next7}
          title="Bookings — next 7 days"
          subtitle="Confirmed sessions per date"
        />
        <TopActivitiesList
          data={topActivities}
          title="Top beach activities"
          subtitle="By confirmed booking count"
        />
      </div>

      <RecentActivityFeed
        items={recentActivity}
        title="Recent beach bookings"
      />
    </div>
  );
}
