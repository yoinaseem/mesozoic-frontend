"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarRangeIcon } from "lucide-react";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { BeachSchedulesSection } from "@/components/admin/beach/BeachSchedulesSection";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api-client";
import { listBeachActivities } from "@/lib/api/beach-activities";
import type { BeachActivity } from "@/types/booking";

// Schedules are a nested resource under each activity (see API §8); there
// is no flat `/beach-activity-schedules` endpoint. To deliver the
// "Schedules" sidebar entry, we let the operator pick an activity and reuse
// the same `BeachSchedulesSection` the activity dashboard uses below.
export default function BeachActivitySchedulesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("beach.create");

  // Aggregate every activity across all pages so the picker is exhaustive.
  // The catalogue is small (single park / single beach domain), so an upfront
  // fetch is cheaper than wiring a paginated combobox.
  const [activities, setActivities] = useState<BeachActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const collected: BeachActivity[] = [];
      let page = 1;
      let lastPage = 1;
      do {
        const res = await listBeachActivities(page);
        collected.push(...res.data);
        lastPage = res.meta.last_page;
        page += 1;
      } while (page <= lastPage);
      collected.sort((a, b) => a.name.localeCompare(b.name));
      setActivities(collected);
      setSelectedId((prev) => prev ?? collected[0]?.id ?? null);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setErrorMessage(error.message || "Failed to load activities.");
      } else {
        setErrorMessage("Failed to load activities.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selected = activities.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Beach schedules" },
        ]}
      />
      <PageHeader
        title="Beach schedules"
        description="Pick an activity to manage its sessions."
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : errorMessage ? (
        <p className="py-20 text-center text-sm text-destructive">
          {errorMessage}
        </p>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border">
          <EmptyState
            icon={CalendarRangeIcon}
            title="No beach activities yet"
            description={
              canCreate
                ? "Create a beach activity first, then schedule its sessions here."
                : "Schedules will appear here once activities are created."
            }
            action={
              canCreate ? (
                <Button asChild size="sm">
                  <Link href="/admin/beach-activities/new">New activity</Link>
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label
                htmlFor="beach-schedules-activity"
                className="block text-xs font-medium text-muted-foreground"
              >
                Activity
              </label>
              <Select
                value={selectedId != null ? String(selectedId) : ""}
                onValueChange={(next) => setSelectedId(Number(next))}
              >
                <SelectTrigger
                  id="beach-schedules-activity"
                  className="w-72"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem
                      key={activity.id}
                      value={String(activity.id)}
                    >
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/beach-activities/${selected.id}`}>
                  Open activity dashboard
                </Link>
              </Button>
            ) : null}
          </div>

          {selected ? (
            // Re-mount the section when the picked activity changes so its
            // pagination + dialog state reset cleanly.
            <BeachSchedulesSection key={selected.id} activity={selected} />
          ) : null}
        </>
      )}
    </div>
  );
}
