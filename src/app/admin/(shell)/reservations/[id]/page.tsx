"use client";

import { format, parseISO } from "date-fns";
import { use, useEffect, useState, type ReactNode } from "react";
import {
  BedIcon,
  TicketIcon,
  TreePalmIcon,
  UmbrellaIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";
import { ApiError, toastApiError } from "@/lib/api-client";
import { cancelBeachBooking, listBeachBookings } from "@/lib/api/beach-bookings";
import {
  cancelParkActivityBooking,
  listParkActivityBookings,
} from "@/lib/api/park-activity-bookings";
import { cancelParkBooking, listParkBookings } from "@/lib/api/park-bookings";
import { getReservation } from "@/lib/api/reservations";
import { cancelRoomBooking } from "@/lib/api/room-bookings";
import type { Paginated } from "@/types/auth";
import type {
  BeachBooking,
  ParkActivityBooking,
  ParkBooking,
  Reservation,
  ReservationStatus,
  RoomBooking,
} from "@/types/booking";

// Walks every page of a Laravel paginated index so a section showing all of
// the tickets attached to one reservation never silently drops anything past
// page 1. Backend pages at 10/each; in practice a single reservation has well
// under that, but the cap (50 pages = 500 rows) prevents a runaway loop if
// `last_page` is ever reported wrong.
async function fetchAllPages<T>(
  fetcher: (page: number) => Promise<Paginated<T>>,
): Promise<T[]> {
  const collected: T[] = [];
  let page = 1;
  for (let safety = 0; safety < 50; safety++) {
    const res = await fetcher(page);
    collected.push(...res.data);
    if (page >= res.meta.last_page) return collected;
    page++;
  }
  return collected;
}

type CancelKind = "room" | "park" | "beach" | "activity";

type PendingCancel = {
  kind: CancelKind;
  id: number;
};

const CANCEL_LABEL: Record<CancelKind, string> = {
  room: "room booking",
  park: "park day-pass",
  beach: "beach booking",
  activity: "park activity booking",
};

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string, time?: string | null): string {
  const date = formatDate(iso);
  return time ? `${date} · ${time.slice(0, 5)}` : date;
}

function formatPrice(value: string | null | undefined): string {
  if (value == null) return "—";
  const n = parseFloat(value);
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function deriveStatus(rooms: RoomBooking[]): ReservationStatus {
  if (rooms.length === 0) return "active";
  const confirmed = rooms.filter((r) => r.status === "confirmed").length;
  if (confirmed === 0) return "cancelled";
  if (confirmed === rooms.length) return "active";
  return "partial";
}

function deriveRoomTotal(rooms: RoomBooking[]): string | null {
  const confirmed = rooms.filter((r) => r.status === "confirmed");
  if (confirmed.length === 0) return null;
  let sum = 0;
  for (const r of confirmed) {
    const n = parseFloat(r.total_price);
    if (!Number.isNaN(n)) sum += n;
  }
  return sum.toFixed(2);
}

function statusVariant(
  status: ReservationStatus,
): "success" | "warning" | "muted" {
  if (status === "active") return "success";
  if (status === "partial") return "warning";
  return "muted";
}

function statusLabel(status: ReservationStatus): string {
  if (status === "active") return "Active";
  if (status === "partial") return "Partial";
  return "Cancelled";
}

function bookingStatusBadge(status: "confirmed" | "cancelled"): ReactNode {
  return (
    <StatusBadge variant={status === "confirmed" ? "success" : "muted"}>
      {status === "confirmed" ? "Confirmed" : "Cancelled"}
    </StatusBadge>
  );
}

type SectionState = "loading" | "error" | "empty" | "ready";

function sectionState({
  loading,
  error,
  rows,
}: {
  loading: boolean;
  error: string;
  rows: unknown[] | null;
}): SectionState {
  if (loading) return "loading";
  if (error) return "error";
  if (!rows || rows.length === 0) return "empty";
  return "ready";
}

type StatCardProps = { label: string; value: ReactNode };
function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-muted/20 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const reservationId = Number(id);
  const invalidId = Number.isNaN(reservationId);

  const { hasPermission } = useAuth();
  const canCancel = hasPermission("bookings.cancel");

  // Reservation envelope (with eager-loaded user + room_bookings)
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [reservationLoading, setReservationLoading] = useState(!invalidId);
  const [reservationError, setReservationError] = useState("");

  // Per-section ticket data — fetched separately because the backend doesn't
  // embed ticket bookings on the ReservationResource (see API_INTEGRATION.md §10).
  const [parkBookings, setParkBookings] = useState<ParkBooking[] | null>(null);
  const [parkLoading, setParkLoading] = useState(true);
  const [parkError, setParkError] = useState("");

  const [beachBookings, setBeachBookings] = useState<BeachBooking[] | null>(
    null,
  );
  const [beachLoading, setBeachLoading] = useState(true);
  const [beachError, setBeachError] = useState("");

  const [activityBookings, setActivityBookings] = useState<
    ParkActivityBooking[] | null
  >(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  const [pendingCancel, setPendingCancel] = useState<PendingCancel | null>(
    null,
  );
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    getReservation(reservationId)
      .then((res) => {
        if (cancelled) return;
        setReservation(res.data);
        setReservationError("");
        setReservationLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setReservationError(err.message || "Failed to load reservation.");
        } else {
          setReservationError("Failed to load reservation.");
        }
        setReservation(null);
        setReservationLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reservationId, invalidId, reloadTick]);

  useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    fetchAllPages((page) =>
      listParkBookings({ reservation_id: reservationId, page }),
    )
      .then((rows) => {
        if (cancelled) return;
        setParkBookings(rows);
        setParkError("");
        setParkLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setParkError(
          err instanceof Error ? err.message : "Failed to load park passes.",
        );
        setParkBookings(null);
        setParkLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reservationId, invalidId, reloadTick]);

  useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    fetchAllPages((page) =>
      listBeachBookings({ reservation_id: reservationId, page }),
    )
      .then((rows) => {
        if (cancelled) return;
        setBeachBookings(rows);
        setBeachError("");
        setBeachLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setBeachError(
          err instanceof Error
            ? err.message
            : "Failed to load beach bookings.",
        );
        setBeachBookings(null);
        setBeachLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reservationId, invalidId, reloadTick]);

  useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    fetchAllPages((page) =>
      listParkActivityBookings({ reservation_id: reservationId, page }),
    )
      .then((rows) => {
        if (cancelled) return;
        setActivityBookings(rows);
        setActivityError("");
        setActivityLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setActivityError(
          err instanceof Error
            ? err.message
            : "Failed to load park activity bookings.",
        );
        setActivityBookings(null);
        setActivityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reservationId, invalidId, reloadTick]);

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    const { kind, id: bookingId } = pendingCancel;
    try {
      if (kind === "room") await cancelRoomBooking(bookingId);
      else if (kind === "park") await cancelParkBooking(bookingId);
      else if (kind === "beach") await cancelBeachBooking(bookingId);
      else if (kind === "activity") await cancelParkActivityBooking(bookingId);
      toast.success(`Cancelled ${CANCEL_LABEL[kind]} #${bookingId}.`);
      setReloadTick((t) => t + 1);
    } catch (err) {
      toastApiError(err);
      throw err;
    }
  };

  if (invalidId) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        Invalid reservation id.
      </p>
    );
  }

  if (reservationLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (reservationError) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        {reservationError}
      </p>
    );
  }

  if (!reservation) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Reservation not found.
      </p>
    );
  }

  const rooms = reservation.room_bookings ?? [];
  const summary = reservation.bookings_summary;
  const status = reservation.status ?? deriveStatus(rooms);

  const roomsCount = summary?.rooms ?? rooms.length;
  const parkCount = summary?.park ?? parkBookings?.length ?? 0;
  const beachCount = summary?.beach ?? beachBookings?.length ?? 0;
  const activityCount = summary?.activity ?? activityBookings?.length ?? 0;

  const totalSource = reservation.total_amount ?? deriveRoomTotal(rooms);
  const totalDisplay = totalSource != null ? formatPrice(totalSource) : null;
  const totalIsPartial = reservation.total_amount == null && totalSource != null;

  // Column definitions per section. Inlined here so the page reads top-to-bottom.

  const roomColumns: DataTableColumn<RoomBooking>[] = [
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
      key: "hotel",
      header: "Hotel",
      cell: (b) => b.hotel?.name ?? `#${b.hotel_id}`,
    },
    {
      key: "room_type",
      header: "Room type",
      cell: (b) => b.room_type?.name ?? `#${b.room_type_id}`,
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
      key: "guests",
      header: "Guests",
      cell: (b) => b.guests,
      headClassName: "w-[5rem]",
    },
    {
      key: "total",
      header: "Total",
      cell: (b) => formatPrice(b.total_price),
      headClassName: "w-[7rem]",
    },
    {
      key: "status",
      header: "Status",
      cell: (b) => bookingStatusBadge(b.status),
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
            onSelect: () => setPendingCancel({ kind: "room", id: b.id }),
          });
        }
        return <RowActions items={items} />;
      },
    },
  ];

  const parkColumns: DataTableColumn<ParkBooking>[] = [
    {
      key: "park",
      header: "Park",
      cell: (b) => (
        <span className="font-medium">{b.park?.name ?? `#${b.park_id}`}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (b) => formatDate(b.date),
    },
    {
      key: "guests",
      header: "Guests",
      cell: (b) => b.guests,
      headClassName: "w-[5rem]",
    },
    {
      key: "total",
      header: "Total",
      cell: (b) => formatPrice(b.total_price),
      headClassName: "w-[7rem]",
    },
    {
      key: "status",
      header: "Status",
      cell: (b) => bookingStatusBadge(b.status),
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
            onSelect: () => setPendingCancel({ kind: "park", id: b.id }),
          });
        }
        return <RowActions items={items} />;
      },
    },
  ];

  const beachColumns: DataTableColumn<BeachBooking>[] = [
    {
      key: "activity",
      header: "Activity",
      cell: (b) => (
        <span className="font-medium">
          {b.schedule?.activity?.name ?? `#${b.beach_activity_schedule_id}`}
        </span>
      ),
    },
    {
      key: "when",
      header: "When",
      cell: (b) =>
        b.schedule
          ? formatDateTime(b.schedule.activity_date, b.schedule.start_time)
          : "—",
    },
    {
      key: "guests",
      header: "Guests",
      cell: (b) => b.guests,
      headClassName: "w-[5rem]",
    },
    {
      key: "total",
      header: "Total",
      cell: (b) => formatPrice(b.total_price),
      headClassName: "w-[7rem]",
    },
    {
      key: "status",
      header: "Status",
      cell: (b) => bookingStatusBadge(b.status),
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
            onSelect: () => setPendingCancel({ kind: "beach", id: b.id }),
          });
        }
        return <RowActions items={items} />;
      },
    },
  ];

  const activityColumns: DataTableColumn<ParkActivityBooking>[] = [
    {
      key: "activity",
      header: "Activity",
      cell: (b) => (
        <span className="font-medium">
          {b.schedule?.activity?.name ?? `#${b.park_activity_schedule_id}`}
        </span>
      ),
    },
    {
      key: "when",
      header: "When",
      cell: (b) =>
        b.schedule
          ? formatDateTime(b.schedule.date, b.schedule.start_time)
          : "—",
    },
    {
      key: "guests",
      header: "Guests",
      cell: (b) => b.guests,
      headClassName: "w-[5rem]",
    },
    {
      key: "total",
      header: "Total",
      cell: (b) => formatPrice(b.total_price),
      headClassName: "w-[7rem]",
    },
    {
      key: "status",
      header: "Status",
      cell: (b) => bookingStatusBadge(b.status),
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
            onSelect: () => setPendingCancel({ kind: "activity", id: b.id }),
          });
        }
        return <RowActions items={items} />;
      },
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Reservations", href: "/admin/reservations" },
          { label: `#${reservation.id}` },
        ]}
      />

      <PageHeader
        title={`Reservation #${reservation.id}`}
        description={`Created ${formatDate(reservation.created_at)}`}
      />

      <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Customer
            </span>
            <StatusBadge variant={statusVariant(status)}>
              {statusLabel(status)}
            </StatusBadge>
          </div>
          {reservation.user ? (
            <>
              <div className="text-lg font-semibold">{reservation.user.name}</div>
              <div className="text-sm text-muted-foreground">
                {reservation.user.email}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              User #{reservation.user_id}
            </div>
          )}
        </div>
        {totalDisplay ? (
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {totalIsPartial ? "Rooms total" : "Total"}
            </div>
            <div className="mt-1 text-2xl font-semibold">{totalDisplay}</div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rooms" value={roomsCount} />
        <StatCard label="Park passes" value={parkCount} />
        <StatCard label="Beach activities" value={beachCount} />
        <StatCard label="Park activities" value={activityCount} />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Rooms</h2>
        <DataTable<RoomBooking>
          columns={roomColumns}
          rows={rooms}
          state={rooms.length === 0 ? "empty" : "ready"}
          getRowId={(b) => b.id}
          emptyState={
            <EmptyState
              icon={BedIcon}
              title="No rooms"
              description="This reservation has no room bookings."
            />
          }
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Park day-passes</h2>
        <DataTable<ParkBooking>
          columns={parkColumns}
          rows={parkBookings ?? []}
          state={sectionState({
            loading: parkLoading,
            error: parkError,
            rows: parkBookings,
          })}
          getRowId={(b) => b.id}
          errorMessage={parkError || undefined}
          emptyState={
            <EmptyState
              icon={TicketIcon}
              title="No park passes"
              description="No theme-park day-passes attached to this reservation."
            />
          }
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Beach activities</h2>
        <DataTable<BeachBooking>
          columns={beachColumns}
          rows={beachBookings ?? []}
          state={sectionState({
            loading: beachLoading,
            error: beachError,
            rows: beachBookings,
          })}
          getRowId={(b) => b.id}
          errorMessage={beachError || undefined}
          emptyState={
            <EmptyState
              icon={UmbrellaIcon}
              title="No beach activities"
              description="No beach activity sessions attached to this reservation."
            />
          }
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Park activities</h2>
        <DataTable<ParkActivityBooking>
          columns={activityColumns}
          rows={activityBookings ?? []}
          state={sectionState({
            loading: activityLoading,
            error: activityError,
            rows: activityBookings,
          })}
          getRowId={(b) => b.id}
          errorMessage={activityError || undefined}
          emptyState={
            <EmptyState
              icon={TreePalmIcon}
              title="No park activities"
              description="No theme-park activity sessions attached to this reservation."
            />
          }
        />
      </section>

      <ConfirmDialog
        open={pendingCancel !== null}
        onOpenChange={(open) => {
          if (!open) setPendingCancel(null);
        }}
        title={
          pendingCancel
            ? `Cancel ${CANCEL_LABEL[pendingCancel.kind]} #${pendingCancel.id}?`
            : "Cancel booking?"
        }
        description="This marks the booking as cancelled. The row stays in the system for reference and the seat is freed up."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        onConfirm={confirmCancel}
      />
    </div>
  );
}
