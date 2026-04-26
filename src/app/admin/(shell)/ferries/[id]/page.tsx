"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FerryArchiveConfirm } from "@/components/admin/ferry/FerryArchiveConfirm";
import { FerryDashboardHeader } from "@/components/admin/ferry/FerryDashboardHeader";
import { FerrySlotsSection } from "@/components/admin/ferry/FerrySlotsSection";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, toastApiError } from "@/lib/api-client";
import { deleteFerry, getFerry } from "@/lib/api/ferries";
import {
  asFerryBlockingBookings,
  cascadeArchiveFerry,
  type BlockingBookingsConflict,
} from "@/lib/api/ferry-cascade-archive";
import type { Ferry } from "@/types/booking";

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

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function FerryDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ferryId = Number(id);
  const router = useRouter();

  const [ferry, setFerry] = useState<Ferry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [cascadeConflict, setCascadeConflict] =
    useState<BlockingBookingsConflict | null>(null);
  // Bumped after slot mutations so the schedules_count card refreshes.
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getFerry(ferryId);
      setFerry(res.data);
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message || "Failed to load ferry.");
      } else {
        setError("Failed to load ferry.");
      }
    } finally {
      setLoading(false);
    }
  }, [ferryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleArchive = async () => {
    if (!ferry) return;
    try {
      await deleteFerry(ferry.id);
      toast.success(`Archived ${ferry.name}.`);
      router.push("/admin/ferries");
    } catch (err) {
      const blocking = asFerryBlockingBookings(err);
      if (blocking) {
        setCascadeConflict(blocking);
        setShowArchiveConfirm(false);
        return;
      }
      toastApiError(err);
      throw err;
    }
  };

  const handleCascade = async () => {
    if (!ferry) return;
    try {
      const outcome = await cascadeArchiveFerry(ferry.id);
      const counts = outcome.kind === "cascaded" ? outcome.counts : {};
      const parts = [`Archived ${ferry.name}`];
      if (counts.slots_archived) {
        parts.push(`${counts.slots_archived} slot(s) archived`);
      }
      if (counts.bookings_cancelled) {
        parts.push(`${counts.bookings_cancelled} booking(s) cancelled`);
      }
      toast.success(parts.join(" · "));
      router.push("/admin/ferries");
    } catch (err) {
      toastApiError(err);
      throw err;
    }
  };

  if (Number.isNaN(ferryId)) {
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
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Ferries", href: "/admin/ferries" },
          { label: ferry.name },
        ]}
      />
      <FerryDashboardHeader
        ferry={ferry}
        onEdit={() => router.push(`/admin/ferries/${ferry.id}/edit`)}
        onArchive={() => setShowArchiveConfirm(true)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Type"
          value={ferry.ferry_type?.name ?? "—"}
        />
        <StatCard
          label="Capacity"
          value={ferry.ferry_type?.capacity ?? "—"}
          note="Inherited from type"
        />
        <StatCard
          label="Price / seat"
          value={formatPrice(ferry.ferry_type?.price)}
          note="Inherited from type"
        />
      </div>

      <FerrySlotsSection
        ferry={ferry}
        tick={tick}
        onChanged={() => {
          // Refresh the ferry for `schedules_count` and bump the section's
          // load tick so its own loader re-runs.
          void load();
          setTick((t) => t + 1);
        }}
      />

      <ConfirmDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title={`Archive ferry ${ferry.name}?`}
        description="Archives the vessel and every slot under it. If any confirmed bookings exist you'll be asked again before they're cancelled."
        confirmLabel="Archive"
        onConfirm={handleArchive}
      />

      <FerryArchiveConfirm
        open={cascadeConflict !== null}
        onOpenChange={(open) => {
          if (!open) setCascadeConflict(null);
        }}
        resourceLabel={`ferry ${ferry.name}`}
        conflict={cascadeConflict}
        onConfirm={handleCascade}
      />
    </div>
  );
}
