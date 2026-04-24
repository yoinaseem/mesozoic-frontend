"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { HotelDashboardHeader } from "@/components/admin/hotels/HotelDashboardHeader";
import {
  RoomTypesSection,
  type RoomTypeAvailability,
} from "@/components/admin/hotels/RoomTypesSection";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, toastApiError } from "@/lib/api-client";
import {
  deleteHotel,
  getHotel,
  getHotelAvailability,
  type HotelAvailability,
} from "@/lib/api/hotels";
import type { Hotel } from "@/types/booking";

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

function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return format(d, "yyyy-MM-dd");
}

export default function HotelDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const hotelId = Number(id);
  const router = useRouter();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [from, setFrom] = useState(() => todayIso());
  const [to, setTo] = useState(() => addDaysIso(todayIso(), 1));
  const [availability, setAvailability] = useState<HotelAvailability | null>(
    null,
  );
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityTick, setAvailabilityTick] = useState(0);

  const dateRangeError =
    from && to && new Date(to) <= new Date(from)
      ? "Check-out must be after check-in."
      : null;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getHotel(hotelId);
      setHotel(res.data);
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message || "Failed to load hotel.");
      } else {
        setError("Failed to load hotel.");
      }
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (Number.isNaN(hotelId)) return;
    if (!from || !to) return;
    if (dateRangeError) return;

    let cancelled = false;

    getHotelAvailability(hotelId, from, to)
      .then((res) => {
        if (cancelled) return;
        setAvailability(res.data);
        setAvailabilityError("");
        setAvailabilityLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setAvailabilityError(err.message || "Failed to load availability.");
        } else {
          setAvailabilityError("Failed to load availability.");
        }
        setAvailability(null);
        setAvailabilityLoading(false);
      });

    // Flip the loading indicator on the next microtask so this setState
    // doesn't count as synchronous inside the effect body.
    queueMicrotask(() => {
      if (!cancelled) setAvailabilityLoading(true);
    });

    return () => {
      cancelled = true;
    };
  }, [hotelId, from, to, availabilityTick, dateRangeError]);

  const handleChanged = useCallback(() => {
    void load();
    setAvailabilityTick((t) => t + 1);
  }, [load]);

  const availabilityByTypeId = useMemo(() => {
    if (!availability) return null;
    const map = new Map<number, RoomTypeAvailability>();
    for (const rt of availability.room_types) {
      map.set(rt.room_type_id, {
        total: rt.total,
        booked: rt.booked,
        free: rt.free,
        rooms: rt.rooms,
      });
    }
    return map;
  }, [availability]);

  const handleDelete = async () => {
    if (!hotel) return;
    try {
      await deleteHotel(hotel.id);
      toast.success(`Deleted ${hotel.name}.`);
      router.push("/admin/hotels");
    } catch (err) {
      toastApiError(err);
      throw err;
    }
  };

  if (Number.isNaN(hotelId)) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        Invalid hotel id.
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

  if (!hotel) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Hotel not found.
      </p>
    );
  }

  const roomTypes = hotel.room_types ?? [];
  const totalRoomTypes = roomTypes.length;
  const totalRooms =
    availability?.totals.total ??
    roomTypes.reduce((sum, rt) => sum + (rt.rooms_count ?? 0), 0);
  const freeRooms = availability?.totals.free;
  const bookedRooms = availability?.totals.booked;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Hotels", href: "/admin/hotels" },
          { label: hotel.name },
        ]}
      />
      <HotelDashboardHeader
        hotel={hotel}
        onEdit={() => router.push(`/admin/hotels/${hotel.id}/edit`)}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium">Availability</h2>
            <p className="text-xs text-muted-foreground">
              Free rooms across this hotel for the selected range.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            <div className="space-y-1">
              <label
                htmlFor="availability-from"
                className="block text-xs font-medium text-muted-foreground"
              >
                From
              </label>
              <DatePicker
                id="availability-from"
                value={from}
                onChange={setFrom}
                max={to ? addDaysIso(to, -1) : undefined}
                className="w-full sm:w-[11rem]"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="availability-to"
                className="block text-xs font-medium text-muted-foreground"
              >
                To
              </label>
              <DatePicker
                id="availability-to"
                value={to}
                onChange={setTo}
                min={from ? addDaysIso(from, 1) : undefined}
                className="w-full sm:w-[11rem]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Room types" value={totalRoomTypes} />
          <StatCard label="Total rooms" value={totalRooms} />
          <StatCard
            label="Free rooms"
            value={
              dateRangeError
                ? "—"
                : availabilityLoading
                  ? "…"
                  : availabilityError
                    ? "—"
                    : (freeRooms ?? "—")
            }
            note={
              dateRangeError
                ? dateRangeError
                : availabilityError
                  ? availabilityError
                  : bookedRooms != null
                    ? `${bookedRooms} booked in this range`
                    : undefined
            }
          />
        </div>
      </div>

      <RoomTypesSection
        hotel={hotel}
        availabilityByTypeId={availabilityByTypeId}
        onChanged={handleChanged}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={`Delete ${hotel.name}?`}
        description="This will also delete all room types and rooms under this hotel. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
