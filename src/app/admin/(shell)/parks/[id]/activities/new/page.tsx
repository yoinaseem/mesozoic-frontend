"use client";

import { use, useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PermissionGate } from "@/components/auth/permission-gate";
import { ParkActivityForm } from "@/components/admin/parks/ParkActivityForm";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import { getThemePark } from "@/lib/api/theme-parks";
import type { ThemePark } from "@/types/booking";

export default function NewParkActivityPage({
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

  useEffect(() => {
    if (invalidParkId) return;
    let cancelled = false;

    getThemePark(parkId)
      .then((res) => {
        if (cancelled) return;
        setPark(res.data);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message || "Failed to load park.");
        } else {
          setError("Failed to load park.");
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [parkId, invalidParkId]);

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
    <PermissionGate permission="park.create">
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Parks", href: "/admin/parks" },
            { label: park.name, href: `/admin/parks/${parkId}` },
            { label: "New activity" },
          ]}
        />
        <ParkActivityForm
          parkId={parkId}
          parkCapacity={park.capacity}
          mode={{ kind: "create" }}
        />
      </div>
    </PermissionGate>
  );
}
