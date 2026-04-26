"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ParkActivitiesSection } from "@/components/admin/parks/ParkActivitiesSection";
import { ParkDashboardHeader } from "@/components/admin/parks/ParkDashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, toastApiError } from "@/lib/api-client";
import { asBlockingBookings } from "@/lib/api/park-cascade";
import { deleteThemePark, getThemePark } from "@/lib/api/theme-parks";
import type { ThemePark } from "@/types/booking";

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

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export default function ParkDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const parkId = Number(id);
  const router = useRouter();

  const [park, setPark] = useState<ThemePark | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getThemePark(parkId);
      setPark(res.data);
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message || "Failed to load park.");
      } else {
        setError("Failed to load park.");
      }
    } finally {
      setLoading(false);
    }
  }, [parkId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    if (!park) return;
    try {
      await deleteThemePark(park.id);
      toast.success(`Archived ${park.name}.`);
      router.push("/admin/parks");
    } catch (err) {
      // DESD-95: park DELETE returns 409 with `blocking_bookings` when
      // upcoming confirmed bookings exist. Tell the operator how many and
      // route them at the bookings pages.
      const blocking = asBlockingBookings(err);
      if (blocking) {
        toast.error(
          `Cannot archive — ${blocking.blocking_bookings} upcoming booking(s) reference this park. Cancel them first via Park bookings / Activity bookings.`,
        );
        throw err;
      }
      toastApiError(err);
      throw err;
    }
  };

  if (Number.isNaN(parkId)) {
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

  const activities = park.activities ?? [];
  const totalActivities = activities.length;
  const totalSchedules = activities.reduce(
    (sum, a) => sum + (a.schedules_count ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Parks", href: "/admin/parks" },
          { label: park.name },
        ]}
      />
      <ParkDashboardHeader
        park={park}
        onEdit={() => router.push(`/admin/parks/${park.id}/edit`)}
        onDelete={() => setShowDeleteConfirm(true)}
        onManageHours={() => router.push(`/admin/parks/${park.id}/hours`)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Activities" value={totalActivities} />
        <StatCard label="Total schedules" value={totalSchedules} />
        <StatCard
          label="Daily capacity"
          value={park.capacity ?? "—"}
          note={`${formatPrice(park.price)} per guest`}
        />
      </div>

      <ParkActivitiesSection park={park} onChanged={() => void load()} />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={`Delete ${park.name}?`}
        description="This will also delete all activities and schedules under this park. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
