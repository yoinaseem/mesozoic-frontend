"use client";

import { use, useCallback, useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PageHeader } from "@/components/admin/PageHeader";
import { ParkHourOverridesSection } from "@/components/admin/parks/ParkHourOverridesSection";
import { ParkOpeningHoursSection } from "@/components/admin/parks/ParkOpeningHoursSection";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import { getThemePark } from "@/lib/api/theme-parks";
import type { ThemePark } from "@/types/booking";

export default function ParkHoursPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const parkId = Number(id);
  const invalidParkId = Number.isNaN(parkId);

  const [park, setPark] = useState<ThemePark | null>(null);
  const [loading, setLoading] = useState(!invalidParkId);
  const [error, setError] = useState("");

  // Bumping this re-fetches both sections so deleting a baseline row, for
  // example, can refresh any computed views the page might add later.
  const [tick, setTick] = useState(0);

  const loadPark = useCallback(async () => {
    if (invalidParkId) return;
    try {
      const res = await getThemePark(parkId);
      setPark(res.data);
      setError("");
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message || "Failed to load park.");
      } else {
        setError("Failed to load park.");
      }
    } finally {
      setLoading(false);
    }
  }, [parkId, invalidParkId]);

  useEffect(() => {
    void loadPark();
  }, [loadPark]);

  if (invalidParkId) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        Invalid park id.
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

  if (!park) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Park not found.
      </p>
    );
  }

  return (
    <PermissionGate permission="park.view">
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Parks", href: "/admin/parks" },
            { label: park.name, href: `/admin/parks/${park.id}` },
            { label: "Hours" },
          ]}
        />
        <PageHeader
          title={`${park.name} — Hours`}
          description="Manage the weekday baseline and per-date overrides. Overrides win over the baseline; missing entries are treated as closed for booking."
        />

        <ParkOpeningHoursSection
          parkId={parkId}
          tick={tick}
          onChanged={() => setTick((t) => t + 1)}
        />

        <Separator />

        <ParkHourOverridesSection
          parkId={parkId}
          tick={tick}
          onChanged={() => setTick((t) => t + 1)}
        />
      </div>
    </PermissionGate>
  );
}
