"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { BeachActivityDashboardHeader } from "@/components/admin/beach/BeachActivityDashboardHeader";
import { BeachSchedulesSection } from "@/components/admin/beach/BeachSchedulesSection";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, toastApiError } from "@/lib/api-client";
import { getBeachActivity } from "@/lib/api/beach-activities";
import { cascadeDeleteBeachActivity } from "@/lib/api/beach-cascade-delete";
import type { BeachActivity } from "@/types/booking";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  note?: string;
};

function StatCard({ label, value, note }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {note ? (
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
  return `${mins}m`;
}

export default function BeachActivityDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const activityId = Number(id);
  const router = useRouter();

  const [activity, setActivity] = useState<BeachActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Bumping this re-fetches both the activity (for schedules_count) and the
  // schedules section so deleting a schedule keeps the count card honest.
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getBeachActivity(activityId);
      setActivity(res.data);
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message || "Failed to load activity.");
      } else {
        setError("Failed to load activity.");
      }
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    if (!activity) return;
    try {
      const summary = await cascadeDeleteBeachActivity(activity.id);
      const parts = [`Deleted ${activity.name}`];
      if (summary.bookings_cancelled > 0) {
        parts.push(`${summary.bookings_cancelled} booking(s) cancelled`);
      }
      if (summary.schedules_deleted > 0) {
        parts.push(`${summary.schedules_deleted} schedule(s) removed`);
      }
      toast.success(parts.join(" · "));
      router.push("/admin/beach-activities");
    } catch (err) {
      toastApiError(err);
      throw err;
    }
  };

  if (Number.isNaN(activityId)) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        Invalid activity id.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-20 text-center text-sm text-destructive">{error}</p>
    );
  }

  if (!activity) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Activity not found.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Beach activities", href: "/admin/beach-activities" },
          { label: activity.name },
        ]}
      />
      <BeachActivityDashboardHeader
        activity={activity}
        onEdit={() => router.push(`/admin/beach-activities/${activity.id}/edit`)}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Capacity"
          value={activity.capacity}
          note="Max guests per session"
        />
        <StatCard
          label="Duration (default)"
          value={formatDuration(activity.duration)}
          note="UI default for new schedules"
        />
        <StatCard
          label="Schedules"
          value={activity.schedules_count ?? "—"}
        />
      </div>

      <BeachSchedulesSection
        activity={activity}
        tick={tick}
        onChanged={() => {
          // Refresh the activity for `schedules_count` and bump the section's
          // load tick so its own loader re-runs too.
          void load();
          setTick((t) => t + 1);
        }}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={`Are you sure you want to delete ${activity.name}?`}
        description="All schedules under this activity and all bookings made for them will also be deleted. Please confirm before making this destructive action!"
        confirmLabel="Delete activity & bookings"
        onConfirm={handleDelete}
      />
    </div>
  );
}
