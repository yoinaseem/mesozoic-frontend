"use client";

import { useCallback, useEffect, useState } from "react";
import { PencilIcon, TicketIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ParkActivityBookingEditDialog } from "@/components/admin/park-activity-bookings/ParkActivityBookingEditDialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, toastApiError } from "@/lib/api-client";
import {
  cancelParkActivityBooking,
  listParkActivityBookings,
  type ParkActivityBookingFilters,
} from "@/lib/api/park-activity-bookings";
import type { Paginated } from "@/types/auth";
import type {
  ParkActivityBooking,
  ParkActivityBookingStatus,
} from "@/types/booking";

function statusBadge(status: ParkActivityBookingStatus) {
  if (status === "confirmed")
    return <StatusBadge variant="success">Confirmed</StatusBadge>;
  return <StatusBadge variant="destructive">Cancelled</StatusBadge>;
}

function formatMoney(value: string): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function formatTime(time: string | null | undefined): string {
  if (!time) return "—";
  return time.length >= 5 ? time.slice(0, 5) : time;
}

type StatusFilter = "all" | ParkActivityBookingStatus;

export default function ParkActivityBookingsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [date, setDate] = useState("");

  const [result, setResult] = useState<Paginated<ParkActivityBooking> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [editing, setEditing] = useState<ParkActivityBooking | null>(null);
  const [pendingCancel, setPendingCancel] =
    useState<ParkActivityBooking | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const filters: ParkActivityBookingFilters = { page };
      if (status !== "all") filters.status = status;
      if (date) filters.date = date;
      const data = await listParkActivityBookings(filters);
      setResult(data);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setErrorMessage(error.message || "Failed to load bookings.");
      } else {
        setErrorMessage("Failed to load bookings.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, status, date]);

  useEffect(() => {
    void load();
  }, [load]);

  // Changing filters should reset pagination — otherwise you can land on
  // page 3 of a filtered set that only has one page.
  useEffect(() => {
    setPage(1);
  }, [status, date]);

  const rows = result?.data ?? [];
  const meta = result?.meta;

  const state = loading
    ? "loading"
    : errorMessage
      ? "error"
      : rows.length === 0
        ? "empty"
        : "ready";

  const columns: DataTableColumn<ParkActivityBooking>[] = [
    {
      key: "id",
      header: "ID",
      cell: (booking) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{booking.id}
        </span>
      ),
      className: "w-[5rem]",
    },
    {
      key: "activity",
      header: "Activity",
      cell: (booking) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {booking.schedule?.activity?.name ?? "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            Schedule #{booking.park_activity_schedule_id}
          </span>
        </div>
      ),
    },
    {
      key: "when",
      header: "Date / Time",
      cell: (booking) => {
        const schedule = booking.schedule;
        return (
          <div className="flex flex-col">
            <span>{schedule?.date ?? "—"}</span>
            <span className="text-xs text-muted-foreground">
              {formatTime(schedule?.start_time)}
            </span>
          </div>
        );
      },
      className: "w-[10rem]",
    },
    {
      key: "reservation",
      header: "Reservation",
      cell: (booking) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{booking.reservation_id}
        </span>
      ),
      className: "w-[8rem]",
    },
    {
      key: "guests",
      header: "Guests",
      cell: (booking) => booking.guests,
      className: "w-[5rem]",
    },
    {
      key: "total",
      header: "Total",
      cell: (booking) => formatMoney(booking.total_price),
      className: "w-[7rem]",
    },
    {
      key: "status",
      header: "Status",
      cell: (booking) => statusBadge(booking.status),
      className: "w-[7rem]",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (booking) => {
        const items: RowActionItem[] = [
          {
            label: "Edit",
            icon: PencilIcon,
            permission: "bookings.update",
            onSelect: () => setEditing(booking),
          },
          {
            label: "Cancel booking",
            icon: Trash2Icon,
            permission: "bookings.cancel",
            variant: "destructive",
            disabled: booking.status === "cancelled",
            onSelect: () => setPendingCancel(booking),
          },
        ];
        return (
          <div className="flex items-center justify-end gap-2">
            <RowActions items={items} />
          </div>
        );
      },
    },
  ];

  const emptyState = (
    <EmptyState
      icon={TicketIcon}
      title={
        status !== "all" || date
          ? "No bookings match these filters"
          : "No bookings yet"
      }
      description="Activity bookings will appear here once customers make reservations."
    />
  );

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    try {
      await cancelParkActivityBooking(pendingCancel.id);
      toast.success(`Cancelled booking #${pendingCancel.id}.`);
      await load();
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Park activity bookings" },
        ]}
      />
      <PageHeader
        title="Park activity bookings"
        description="View, update, and cancel park activity session tickets."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label
            htmlFor="booking-status"
            className="block text-xs font-medium text-muted-foreground"
          >
            Status
          </label>
          <Select
            value={status}
            onValueChange={(next) => setStatus(next as StatusFilter)}
          >
            <SelectTrigger id="booking-status" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="booking-date"
            className="block text-xs font-medium text-muted-foreground"
          >
            Date
          </label>
          <DatePicker
            id="booking-date"
            value={date}
            onChange={setDate}
            className="w-48"
          />
        </div>

        {date || status !== "all" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus("all");
              setDate("");
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <DataTable<ParkActivityBooking>
        columns={columns}
        rows={rows}
        state={state}
        getRowId={(booking) => booking.id}
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={meta.current_page >= meta.last_page || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null
        }
      />

      <ParkActivityBookingEditDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        booking={editing}
        onSuccess={() => {
          setEditing(null);
          void load();
        }}
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
        description="This will soft-cancel the booking. It will stay in the system for audit."
        confirmLabel="Cancel booking"
        onConfirm={confirmCancel}
      />
    </div>
  );
}
