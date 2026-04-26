"use client";

import { use, useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PermissionGate } from "@/components/auth/permission-gate";
import { BeachActivityForm } from "@/components/admin/beach/BeachActivityForm";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import { getBeachActivity } from "@/lib/api/beach-activities";
import type { BeachActivity } from "@/types/booking";

export default function EditBeachActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const activityId = Number(id);
  const invalidId = Number.isNaN(activityId);

  const [activity, setActivity] = useState<BeachActivity | null>(null);
  const [loading, setLoading] = useState(!invalidId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (invalidId) return;
    let cancelled = false;

    getBeachActivity(activityId)
      .then((res) => {
        if (cancelled) return;
        setActivity(res.data);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message || "Failed to load activity.");
        } else {
          setError("Failed to load activity.");
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activityId, invalidId]);

  if (invalidId) {
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
    <PermissionGate permission="beach.update">
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Beach activities", href: "/admin/beach-activities" },
            {
              label: activity.name,
              href: `/admin/beach-activities/${activity.id}`,
            },
            { label: "Edit" },
          ]}
        />
        <BeachActivityForm mode={{ kind: "edit", initial: activity }} />
      </div>
    </PermissionGate>
  );
}
