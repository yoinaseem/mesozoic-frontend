"use client";

import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { BookIcon, HashIcon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { ApiError, toastApiError } from "@/lib/api-client";
import { getHotel } from "@/lib/api/hotels";
import {
  cancelRoomBooking,
  listMyHotels,
  listRoomBookings,
  type MyHotel,
} from "@/lib/api/room-bookings";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types/auth";
import type { RoomBooking, RoomBookingStatus, RoomType } from "@/types/booking";

// Radix Select can't use an empty-string value for an item (it reserves "" for
// the "no selection" state), so we map our "All" sentinel through __all when
// talking to the Select primitive.
const ALL_VALUE = "__all";

type FilterSelectProps = {
  id?: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
};

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  className,
}: FilterSelectProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={controlId}
        className="block text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <Select
        value={value === "" ? ALL_VALUE : value}
        onValueChange={(next) => onChange(next === ALL_VALUE ? "" : next)}
      >
        <SelectTrigger id={controlId} size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem
              key={opt.value === "" ? ALL_VALUE : opt.value}
              value={opt.value === "" ? ALL_VALUE : opt.value}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

function formatPrice(value: string): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function HotelBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const canCancel = hasPermission("bookings.cancel");

  const statusParam = searchParams.get("status");
  const status: RoomBookingStatus | null =
    statusParam === "confirmed" || statusParam === "cancelled"
      ? statusParam
      : null;
  const hotelIdParam = searchParams.get("hotel_id");
  const selectedHotelId = hotelIdParam ? Number(hotelIdParam) : null;
  const roomTypeIdParam = searchParams.get("room_type_id");
  const roomTypeId = roomTypeIdParam ? Number(roomTypeIdParam) : null;
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const [showIds, setShowIds] = useState(false);
  const [myHotels, setMyHotels] = useState<MyHotel[] | null>(null);
  // Keyed by hotelId so stale types from a previous hotel don't leak through
  // the dropdown while a new fetch is in flight.
  const [roomTypesFetch, setRoomTypesFetch] = useState<{
    hotelId: number;
    types: RoomType[];
  } | null>(null);
  const [result, setResult] = useState<Paginated<RoomBooking> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const [pendingCancel, setPendingCancel] = useState<RoomBooking | null>(null);

  // Load user's scoped hotels once on mount.
  useEffect(() => {
    let cancelled = false;
    listMyHotels()
      .then((res) => {
        if (!cancelled) setMyHotels(res.data);
      })
      .catch(() => {
        if (!cancelled) setMyHotels([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // If the user has exactly one hotel in scope, use it as the effective
  // hotel id without requiring them to pick from a dropdown that would be
  // hidden anyway.
  const autoScopedHotelId =
    myHotels !== null && myHotels.length === 1 ? myHotels[0].id : null;
  const effectiveHotelId = selectedHotelId ?? autoScopedHotelId;

  // Load room types when a hotel is in effect. No synchronous setState in the
  // effect body (satisfies react-hooks/set-state-in-effect) — stale types are
  // filtered out at render time via the hotelId key check.
  useEffect(() => {
    if (effectiveHotelId === null) return;
    const targetHotelId = effectiveHotelId;
    let cancelled = false;
    getHotel(targetHotelId)
      .then((res) => {
        if (!cancelled) {
          setRoomTypesFetch({
            hotelId: targetHotelId,
            types: res.data.room_types ?? [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoomTypesFetch({ hotelId: targetHotelId, types: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveHotelId]);

  const roomTypes =
    roomTypesFetch && roomTypesFetch.hotelId === effectiveHotelId
      ? roomTypesFetch.types
      : [];

  // Client-side date-range guard matches the backend's 422 so we never fire
  // a doomed request.
  const dateRangeError =
    from && to && new Date(to) < new Date(from)
      ? "Check-out date must be on or after check-in."
      : null;

  // Load bookings whenever filters / page / reload-tick change.
  useEffect(() => {
    if (dateRangeError) return;
    let cancelled = false;

    listRoomBookings({
      page,
      status: status ?? undefined,
      hotel_id: effectiveHotelId ?? undefined,
      room_type_id: roomTypeId ?? undefined,
      check_in_from: from || undefined,
      check_in_to: to || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setErrorMessage("");
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setErrorMessage(err.message || "Failed to load bookings.");
        } else {
          setErrorMessage("Failed to load bookings.");
        }
        setResult(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    page,
    status,
    effectiveHotelId,
    roomTypeId,
    from,
    to,
    dateRangeError,
    reloadTick,
  ]);

  // Batched URL writer — multiple filter changes in a single handler must go
  // through one call to avoid stale-closure overwrites against `searchParams`.
  const updateFilters = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    // Any filter change resets pagination unless the caller is updating page.
    if (!("page" in updates)) next.delete("page");
    const query = next.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  };

  const updateFilter = (key: string, value: string | null) =>
    updateFilters({ [key]: value });

  const setPage = (nextPage: number) =>
    updateFilters({ page: nextPage <= 1 ? null : String(nextPage) });

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    try {
      await cancelRoomBooking(pendingCancel.id);
      toast.success(`Cancelled booking #${pendingCancel.id}.`);
      setReloadTick((t) => t + 1);
    } catch (err) {
      toastApiError(err);
      throw err;
    }
  };

  const hotelsLoaded = myHotels !== null;
  const showHotelFilter = (myHotels?.length ?? 0) > 1;
  // Only show the Room Type filter when we actually have a scoped hotel
  // (either via auto-scope or user selection).
  const showRoomTypeFilter = effectiveHotelId !== null;

  const rows = result?.data ?? [];
  const meta = result?.meta;

  const state =
    !hotelsLoaded || loading
      ? "loading"
      : dateRangeError
        ? "empty"
        : errorMessage
          ? "error"
          : rows.length === 0
            ? "empty"
            : "ready";

  const columns: DataTableColumn<RoomBooking>[] = [
    ...(showIds
      ? [
          {
            key: "id",
            header: "ID",
            cell: (b: RoomBooking) => (
              <span className="font-mono text-xs text-muted-foreground">
                {b.id}
              </span>
            ),
            headClassName: "w-[5rem]",
          } satisfies DataTableColumn<RoomBooking>,
        ]
      : []),
    ...(showHotelFilter
      ? [
          {
            key: "hotel",
            header: "Hotel",
            cell: (b: RoomBooking) => b.hotel?.name ?? `#${b.hotel_id}`,
          } satisfies DataTableColumn<RoomBooking>,
        ]
      : []),
    {
      key: "room",
      header: "Room",
      cell: (b) => (
        <span className="font-medium">
          {b.room?.room_no ?? `#${b.room_id}`}
        </span>
      ),
      headClassName: "w-[6rem]",
    },
    {
      key: "room_type",
      header: "Room type",
      cell: (b) => b.room_type?.name ?? `#${b.room_type_id}`,
    },
    {
      key: "guest",
      header: "Reservation",
      cell: (b) => (
        <span className="text-muted-foreground">
          #{b.reservation_id}
          {b.guests ? ` · ${b.guests} guest${b.guests === 1 ? "" : "s"}` : ""}
        </span>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      cell: (b) => (
        <div className="flex flex-col">
          <span>
            {formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}
          </span>
          <span className="text-xs text-muted-foreground">
            {b.nights} night{b.nights === 1 ? "" : "s"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (b) => (
        <StatusBadge variant={b.status === "confirmed" ? "success" : "muted"}>
          {b.status === "confirmed" ? "Confirmed" : "Cancelled"}
        </StatusBadge>
      ),
      headClassName: "w-[7rem]",
    },
    {
      key: "total",
      header: "Total",
      cell: (b) => formatPrice(b.total_price),
      headClassName: "w-[7rem]",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (b) => {
        const items: RowActionItem[] = [];
        if (canCancel && b.status === "confirmed") {
          items.push({
            label: "Cancel booking",
            icon: XCircleIcon,
            variant: "destructive",
            onSelect: () => setPendingCancel(b),
          });
        }
        return <RowActions items={items} />;
      },
    },
  ];

  const emptyState = dateRangeError ? (
    <EmptyState
      icon={BookIcon}
      title="Invalid date range"
      description={dateRangeError}
    />
  ) : (
    <EmptyState
      icon={BookIcon}
      title="No bookings match your filters"
      description="Try widening the date range or clearing the status filter."
    />
  );

  const hotelOptions = [
    { value: "", label: "All hotels" },
    ...(myHotels ?? []).map((h) => ({
      value: String(h.id),
      label: h.name,
    })),
  ];

  const roomTypeOptions = [
    { value: "", label: "All room types" },
    ...roomTypes.map((rt) => ({
      value: String(rt.id),
      label: rt.name,
    })),
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Hotels", href: "/admin/hotels" },
          { label: "Bookings" },
        ]}
      />

      <PageHeader
        title="Hotel Bookings"
        description="Room bookings across hotels you have scope for."
        actions={
          <Button
            size="sm"
            variant={showIds ? "secondary" : "outline"}
            onClick={() => setShowIds((prev) => !prev)}
            aria-pressed={showIds}
          >
            <HashIcon />
            {showIds ? "Hide IDs" : "Show IDs"}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:flex-wrap sm:items-end">
        <FilterSelect
          label="Status"
          value={status ?? ""}
          options={STATUS_OPTIONS}
          onChange={(v) => updateFilter("status", v || null)}
          className="sm:w-[10rem]"
        />

        {showHotelFilter ? (
          <FilterSelect
            label="Hotel"
            value={selectedHotelId !== null ? String(selectedHotelId) : ""}
            options={hotelOptions}
            onChange={(v) =>
              // Swapping or clearing the hotel invalidates the room-type filter,
              // so we batch both writes to avoid clobbering the URL.
              updateFilters({
                hotel_id: v || null,
                room_type_id: null,
              })
            }
            className="sm:w-[14rem]"
          />
        ) : null}

        {showRoomTypeFilter ? (
          <FilterSelect
            label="Room Type"
            value={roomTypeId !== null ? String(roomTypeId) : ""}
            options={roomTypeOptions}
            onChange={(v) => updateFilter("room_type_id", v || null)}
            className="sm:w-[14rem]"
          />
        ) : null}

        <div className="space-y-1 sm:w-[11rem]">
          <label
            htmlFor="bookings-from"
            className="block text-xs font-medium text-muted-foreground"
          >
            Check-in from
          </label>
          <DatePicker
            id="bookings-from"
            value={from || null}
            onChange={(v) => updateFilter("from", v || null)}
            max={to || undefined}
          />
        </div>
        <div className="space-y-1 sm:w-[11rem]">
          <label
            htmlFor="bookings-to"
            className="block text-xs font-medium text-muted-foreground"
          >
            Check-in to
          </label>
          <DatePicker
            id="bookings-to"
            value={to || null}
            onChange={(v) => updateFilter("to", v || null)}
            min={from || undefined}
          />
        </div>
      </div>

      <DataTable<RoomBooking>
        columns={columns}
        rows={rows}
        state={state}
        getRowId={(b) => b.id}
        errorMessage={errorMessage}
        emptyState={emptyState}
        pagination={
          meta && meta.last_page > 1 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {meta.current_page} of {meta.last_page} · {meta.total}{" "}
                total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, meta.current_page - 1))}
                  disabled={meta.current_page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(meta.current_page + 1)}
                  disabled={meta.current_page >= meta.last_page || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null
        }
      />

      <ConfirmDialog
        open={pendingCancel !== null}
        onOpenChange={(open) => {
          if (!open) setPendingCancel(null);
        }}
        title={
          pendingCancel
            ? `Cancel booking #${pendingCancel.id}?`
            : "Cancel booking?"
        }
        description="This marks the booking as cancelled. The row stays in the system for reference, and the room is freed up for the same dates."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        onConfirm={confirmCancel}
      />
    </div>
  );
}
