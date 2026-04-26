"use client";

import { use, useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PermissionGate } from "@/components/auth/permission-gate";
import { FerryForm } from "@/components/admin/ferry/FerryForm";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import { getFerry } from "@/lib/api/ferries";
import type { Ferry } from "@/types/booking";

export default function EditFerryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ferryId = Number(id);
  const invalidId = Number.isNaN(ferryId);

  const [ferry, setFerry] = useState<Ferry | null>(null);
  const [loading, setLoading] = useState(!invalidId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (invalidId) return;
    let cancelled = false;

    getFerry(ferryId)
      .then((res) => {
        if (cancelled) return;
        setFerry(res.data);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message || "Failed to load ferry.");
        } else {
          setError("Failed to load ferry.");
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ferryId, invalidId]);

  if (invalidId) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        Invalid ferry id.
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

  if (!ferry) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Ferry not found.
      </p>
    );
  }

  return (
    <PermissionGate permission="ferry.update">
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Ferries", href: "/admin/ferries" },
            { label: ferry.name, href: `/admin/ferries/${ferry.id}` },
            { label: "Edit" },
          ]}
        />
        <FerryForm mode={{ kind: "edit", initial: ferry }} />
      </div>
    </PermissionGate>
  );
}
