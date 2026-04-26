"use client";

import { CalendarHeart, TicketCheck } from "lucide-react";

import { StatTile } from "@/components/dashboard/StatTile";
import { ClosuresWidget } from "@/components/admin-dashboard/ClosuresWidget";
import { Next7DaysChart } from "@/components/admin-dashboard/Next7DaysChart";
import { RecentActivityFeed } from "@/components/admin-dashboard/RecentActivityFeed";
import { TopActivitiesList } from "@/components/admin-dashboard/TopActivitiesList";
import {
  deriveBookingsNext7Days,
  deriveRecentActivity,
  deriveTopParkActivities,
  deriveUpcomingParkClosures,
  type AdminSnapshot,
} from "@/lib/admin-dashboard";

type Props = {
  snapshot: AdminSnapshot;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ParkManagerView({ snapshot }: Props) {
  const today = todayIso();

  const dayPassesToday = snapshot.parkBookings.filter(
    (b) => b.status === "confirmed" && b.date === today,
  ).length;
  const activitiesToday = snapshot.parkActivityBookings.filter(
    (b) => b.status === "confirmed" && (b.schedule?.date ?? "") === today,
  ).length;

  const closures = deriveUpcomingParkClosures(snapshot);
  const topActivities = deriveTopParkActivities(snapshot);
  const dayPassesNext7 = deriveBookingsNext7Days(
    snapshot.parkBookings,
    (b) => b.date,
  );
  const activitiesNext7 = deriveBookingsNext7Days(
    snapshot.parkActivityBookings,
    (b) => b.schedule?.date ?? "",
  );

  const recentActivity = deriveRecentActivity(snapshot, 10).filter(
    (i) => i.type === "park" || i.type === "activity",
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Day passes today"
          value={String(dayPassesToday)}
          hint="Confirmed park admissions"
          icon={TicketCheck}
          accent="primary"
        />
        <StatTile
          label="Activities today"
          value={String(activitiesToday)}
          hint="Confirmed activity bookings"
          icon={CalendarHeart}
          accent="primary"
        />
        <StatTile
          label="Upcoming closures"
          value={String(closures.length)}
          hint="Future override-driven closed days"
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Next7DaysChart
          data={dayPassesNext7}
          title="Day passes — next 7 days"
          subtitle="Confirmed admissions per date"
        />
        <Next7DaysChart
          data={activitiesNext7}
          title="Activities — next 7 days"
          subtitle="Confirmed activity bookings per date"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <TopActivitiesList
          data={topActivities}
          title="Top park activities"
          subtitle="By confirmed booking count"
        />
        <ClosuresWidget closures={closures} />
      </div>

      <RecentActivityFeed
        items={recentActivity}
        title="Recent park bookings"
      />
    </div>
  );
}
