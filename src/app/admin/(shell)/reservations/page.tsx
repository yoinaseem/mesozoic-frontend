"use client";

import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { ReceiptIcon } from "lucide-react";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { listReservations } from "@/lib/api/reservations";
import { listMyHotels, type MyHotel } from "@/lib/api/room-bookings";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types/auth";
import type {
  Reservation,
  ReservationStatus,
  RoomBooking,
} from "@/types/booking";

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

function FilterSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-8 w-full" />
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

function formatPrice(value: string | null | undefined): string {
  if (value == null) return "—";
  const n = parseFloat(value);
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "partial", label: "Partial" },
  { value: "cancelled", label: "Cancelled" },
];

function isReservationStatus(value: string): value is ReservationStatus {
  return value === "active" || value === "partial" || value === "cancelled";
}

// Computed-from-room_bookings fallbacks for when the backend hasn't yet
// shipped status / total_amount / bookings_summary.
function deriveStatus(rooms: RoomBooking[]): ReservationStatus {
  if (rooms.length === 0) return "active";
  const confirmed = rooms.filter((r) => r.status === "confirmed").length;
  if (confirmed === 0) return "cancelled";
  if (confirmed === rooms.length) return "active";
  return "partial";
}

function deriveTripDates(rooms: RoomBooking[]): string | null {
  const confirmed = rooms.filter((r) => r.status === "confirmed");
  if (confirmed.length === 0) return null;
  const checkIns = confirmed.map((r) => r.check_in_date).sort();
  const checkOuts = confirmed.map((r) => r.check_out_date).sort();
  return `${formatDate(checkIns[0])} → ${formatDate(checkOuts[checkOuts.length - 1])}`;
}

function deriveHotels(rooms: RoomBooking[]): string[] {
  const seen = new Set<string>();
  for (const r of rooms) {
    const name = r.hotel?.name ?? `#${r.hotel_id}`;
    if (!seen.has(name)) seen.add(name);
  }
  return Array.from(seen);
}

// Partial fallback when the backend hasn't shipped `total_amount` yet (Ask 3).
// Sums confirmed room-booking totals only — tickets aren't on the eager-load,
// so this is rooms-subtotal until the backend total lands.
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

export default function ReservationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status");
  const status: ReservationStatus | null =
    statusParam && isReservationStatus(statusParam) ? statusParam : null;
  const hotelIdParam = searchParams.get("hotel_id");
  const selectedHotelId = hotelIdParam ? Number(hotelIdParam) : null;
  const customerParam = searchParams.get("customer") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const [myHotels, setMyHotels] = useState<MyHotel[] | null>(null);
  const [result, setResult] = useState<Paginated<Reservation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchInput, setSearchInput] = useState(customerParam);

  // Load the user's scoped hotels once on mount — drives the Hotel filter.
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

  // Debounced URL push for the customer search input. 300ms feels responsive
  // without firing a request on every keystroke.
  useEffect(() => {
    if (searchInput === customerParam) return;
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (searchInput) next.set("customer", searchInput);
      else next.delete("customer");
      next.delete("page");
      const query = next.toString();
      router.replace(query ? `?${query}` : "?", { scroll: false });
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, customerParam, router, searchParams]);

  // Load reservations whenever filters / page change. Initial `loading: true`
  // covers the first fetch; on filter changes we keep the previous rows on
  // screen until the new ones land (matches the hotels/bookings pattern).
  useEffect(() => {
    let cancelled = false;
    listReservations({
      page,
      status: status ?? undefined,
      hotel_id: selectedHotelId ?? undefined,
      customer: customerParam || undefined,
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
          setErrorMessage(err.message || "Failed to load reservations.");
        } else {
          setErrorMessage("Failed to load reservations.");
        }
        setResult(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, status, selectedHotelId, customerParam]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in updates)) next.delete("page");
    const query = next.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  };

  const updateFilter = (key: string, value: string | null) =>
    updateFilters({ [key]: value });

  const setPage = (nextPage: number) =>
    updateFilters({ page: nextPage <= 1 ? null : String(nextPage) });

  const hotelsLoaded = myHotels !== null;
  const showHotelFilter = (myHotels?.length ?? 0) > 1;

  const rows = result?.data ?? [];
  const meta = result?.meta;

  const state =
    !hotelsLoaded || loading
      ? "loading"
      : errorMessage
        ? "error"
        : rows.length === 0
          ? "empty"
          : "ready";

  const hotelOptions = useMemo(
    () => [
      { value: "", label: "All hotels" },
      ...(myHotels ?? []).map((h) => ({
        value: String(h.id),
        label: h.name,
      })),
    ],
    [myHotels],
  );

  const columns: DataTableColumn<Reservation>[] = [
    {
      key: "id",
      header: "ID",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">#{r.id}</span>
      ),
      headClassName: "w-[5rem]",
    },
    {
      key: "customer",
      header: "Customer",
      cell: (r) =>
        r.user ? (
          <div className="flex flex-col">
            <span className="font-medium">{r.user.name}</span>
            <span className="text-xs text-muted-foreground">{r.user.email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">#{r.user_id}</span>
        ),
    },
    {
      key: "dates",
      header: "Trip dates",
      cell: (r) => {
        const dates = deriveTripDates(r.room_bookings ?? []);
        return dates ?? <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: "hotels",
      header: "Hotels",
      cell: (r) => {
        const hotels = deriveHotels(r.room_bookings ?? []);
        if (hotels.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        const visible = hotels.slice(0, 2);
        const extra = hotels.length - visible.length;
        return (
          <div className="flex flex-wrap gap-1">
            {visible.map((name) => (
              <span
                key={name}
                className="rounded-md bg-muted px-2 py-0.5 text-xs"
              >
                {name}
              </span>
            ))}
            {extra > 0 ? (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                +{extra}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "bookings",
      header: "Bookings",
      cell: (r) => {
        if (r.bookings_summary) {
          const s = r.bookings_summary;
          const tickets = s.park + s.beach + s.activity + s.ferry;
          return (
            <span className="text-sm">
              {s.rooms} room{s.rooms === 1 ? "" : "s"} · {tickets} ticket
              {tickets === 1 ? "" : "s"}
            </span>
          );
        }
        const rooms = (r.room_bookings ?? []).length;
        return (
          <span className="text-sm text-muted-foreground">
            {rooms} room{rooms === 1 ? "" : "s"}
          </span>
        );
      },
    },
    {
      key: "total",
      header: "Total",
      cell: (r) => {
        const total = r.total_amount ?? deriveRoomTotal(r.room_bookings ?? []);
        return formatPrice(total);
      },
      headClassName: "w-[7rem]",
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const s = r.status ?? deriveStatus(r.room_bookings ?? []);
        return <StatusBadge variant={statusVariant(s)}>{statusLabel(s)}</StatusBadge>;
      },
      headClassName: "w-[7rem]",
    },
  ];

  const emptyState = (
    <EmptyState
      icon={ReceiptIcon}
      title="No reservations match your filters"
      description="Try clearing the status filter or customer search."
    />
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Reservations" },
        ]}
      />

      <PageHeader
        title="Reservations"
        description="Trip envelopes grouping rooms, park, beach, and ferry bookings."
      />

      {hotelsLoaded ? (
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
              onChange={(v) => updateFilter("hotel_id", v || null)}
              className="sm:w-[14rem]"
            />
          ) : null}

          <div className="space-y-1 sm:w-[16rem]">
            <label
              htmlFor="reservations-customer"
              className="block text-xs font-medium text-muted-foreground"
            >
              Customer
            </label>
            <Input
              id="reservations-customer"
              type="search"
              placeholder="Name or email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterSkeleton className="sm:w-[10rem]" />
          <FilterSkeleton className="sm:w-[14rem]" />
          <FilterSkeleton className="sm:w-[16rem]" />
        </div>
      )}

      <DataTable<Reservation>
        columns={columns}
        rows={rows}
        state={state}
        getRowId={(r) => r.id}
        errorMessage={errorMessage}
        emptyState={emptyState}
        onRowClick={(r) => router.push(`/admin/reservations/${r.id}`)}
        pagination={
          meta && meta.last_page > 1 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {meta.current_page} of {meta.last_page} · {meta.total} total
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
    </div>
  );
}
