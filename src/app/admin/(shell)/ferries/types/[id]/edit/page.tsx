"use client";

import { use, useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PermissionGate } from "@/components/auth/permission-gate";
import { FerryTypeForm } from "@/components/admin/ferry/FerryTypeForm";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import { getFerryType } from "@/lib/api/ferry-types";
import type { FerryType } from "@/types/booking";

export default function EditFerryTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const typeId = Number(id);
  const invalidId = Number.isNaN(typeId);

  const [ferryType, setFerryType] = useState<FerryType | null>(null);
  const [loading, setLoading] = useState(!invalidId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (invalidId) return;
    let cancelled = false;

    getFerryType(typeId)
      .then((res) => {
        if (cancelled) return;
        setFerryType(res.data);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message || "Failed to load ferry type.");
        } else {
          setError("Failed to load ferry type.");
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [typeId, invalidId]);

  if (invalidId) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        Invalid ferry type id.
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

  if (!ferryType) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Ferry type not found.
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
            { label: ferryType.name },
            { label: "Edit" },
          ]}
        />
        <FerryTypeForm mode={{ kind: "edit", initial: ferryType }} />
      </div>
    </PermissionGate>
  );
}
