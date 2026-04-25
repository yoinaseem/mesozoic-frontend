"use client";

import { use, useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PermissionGate } from "@/components/auth/permission-gate";
import { ParkActivityForm } from "@/components/admin/parks/ParkActivityForm";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import { getParkActivity } from "@/lib/api/park-activities";
import { getThemePark } from "@/lib/api/theme-parks";
import type { ParkActivity, ThemePark } from "@/types/booking";

export default function EditParkActivityPage({
  params,
}: {
  params: Promise<{ id: string; aid: string }>;
}) {
  const { id, aid } = use(params);
  const parkId = Number(id);
  const activityId = Number(aid);
  const invalidIds = Number.isNaN(parkId) || Number.isNaN(activityId);

  const [park, setPark] = useState<ThemePark | null>(null);
  const [activity, setActivity] = useState<ParkActivity | null>(null);
  const [loading, setLoading] = useState(!invalidIds);
  const [error, setError] = useState("");

  useEffect(() => {
    if (invalidIds) return;
    let cancelled = false;

    Promise.all([getThemePark(parkId), getParkActivity(parkId, activityId)])
      .then(([parkRes, activityRes]) => {
        if (cancelled) return;
        setPark(parkRes.data);
        setActivity(activityRes.data);
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
  }, [parkId, activityId, invalidIds]);

  if (invalidIds) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        Invalid park or activity id.
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

  if (!park || !activity) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Activity not found.
      </p>
    );
  }

  return (
    <PermissionGate permission="park.update">
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Parks", href: "/admin/parks" },
            { label: park.name, href: `/admin/parks/${park.id}` },
            { label: activity.name },
            { label: "Edit" },
          ]}
        />
        <ParkActivityForm
          parkId={parkId}
          parkCapacity={park.capacity}
          mode={{ kind: "edit", initial: activity }}
        />
      </div>
    </PermissionGate>
  );
}
