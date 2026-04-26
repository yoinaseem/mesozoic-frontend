"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarRangeIcon,
  MoonIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import {
  FerryScheduleDialog,
  type FerryScheduleDialogMode,
} from "@/components/admin/ferry/FerryScheduleDialog";
import { FerryArchiveConfirm } from "@/components/admin/ferry/FerryArchiveConfirm";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { ApiError, toastApiError } from "@/lib/api-client";
import { listFerries, listFerrySchedules } from "@/lib/api/ferries";
import {
  asFerryBlockingBookings,
  cascadeArchiveFerrySchedule,
  type BlockingBookingsConflict,
} from "@/lib/api/ferry-cascade-archive";
import {
  deleteFerrySchedule,
  listAllFerrySchedules,
} from "@/lib/api/ferry-schedules";
import type { Paginated } from "@/types/auth";
import type { Ferry, FerrySchedule } from "@/types/booking";

function formatTime(time: string): string {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function isOvernight(slot: FerrySchedule): boolean {
  return slot.arrival_time < slot.departure_time;
}

type FerryFilter = "all" | number;

export default function FerrySchedulesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("ferry.create");
  const canUpdate = hasPermission("ferry.update");
  const canDelete = hasPermission("ferry.delete");

  // Filter: "all" hits /ferry-schedules; a specific ferry id hits the
  // per-ferry endpoint (so pagination is still server-side).
  const [filterFerryId, setFilterFerryId] = useState<FerryFilter>("all");
  const [page, setPage] = useState(1);

  const [ferries, setFerries] = useState<Ferry[]>([]);
  const [ferriesLoading, setFerriesLoading] = useState(true);
  const [ferriesError, setFerriesError] = useState("");

  const [result, setResult] = useState<Paginated<FerrySchedule> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [dialogMode, setDialogMode] = useState<FerryScheduleDialogMode | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<FerrySchedule | null>(
    null,
  );
  const [cascadeTarget, setCascadeTarget] = useState<{
    slot: FerrySchedule;
    conflict: BlockingBookingsConflict | null;
  } | null>(null);

  // Aggregate every ferry up-front for the filter Select. Catalogue is small
  // enough that an exhaustive walk beats wiring a paginated combobox.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFerriesLoading(true);
      setFerriesError("");
      try {
        const collected: Ferry[] = [];
        let p = 1;
        let lastPage = 1;
        do {
          const res = await listFerries(p);
          collected.push(...res.data);
          lastPage = res.meta.last_page;
          p += 1;
        } while (p <= lastPage);
        if (cancelled) return;
        collected.sort((a, b) => a.name.localeCompare(b.name));
        setFerries(collected);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError || error instanceof Error) {
          setFerriesError(error.message || "Failed to load ferries.");
        } else {
          setFerriesError("Failed to load ferries.");
        }
      } finally {
        if (!cancelled) setFerriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data =
        filterFerryId === "all"
          ? await listAllFerrySchedules(page)
          : await listFerrySchedules(filterFerryId, page);
      setResult(data);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setErrorMessage(error.message || "Failed to load slots.");
      } else {
        setErrorMessage("Failed to load slots.");
      }
    } finally {
      setLoading(false);
    }
  }, [filterFerryId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // Reset pagination when the filter changes — otherwise we could land on
  // page 3 of a single-page filtered set.
  useEffect(() => {
    setPage(1);
  }, [filterFerryId]);

  const rows = result?.data ?? [];
  const meta = result?.meta;

  const state = loading
    ? "loading"
    : errorMessage
      ? "error"
      : rows.length === 0
        ? "empty"
        : "ready";

  const showFerryColumn = filterFerryId === "all";

  const columns: DataTableColumn<FerrySchedule>[] = [
    ...(showFerryColumn
      ? [
          {
            key: "ferry",
            header: "Ferry",
            cell: (slot: FerrySchedule) => (
              <span className="font-medium">{slot.ferry?.name ?? "—"}</span>
            ),
          },
        ]
      : []),
    {
      key: "departure",
      header: "Departure",
      cell: (slot) => formatTime(slot.departure_time),
      className: "w-32",
    },
    {
      key: "arrival",
      header: "Arrival",
      cell: (slot) => (
        <>
          <span>{formatTime(slot.arrival_time)}</span>
          {isOvernight(slot) ? (
            <span
              className="ml-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground"
              title="Overnight crossing — arrives next calendar day"
            >
              <MoonIcon className="size-3" aria-hidden />
              overnight
            </span>
          ) : null}
        </>
      ),
      className: "w-40",
    },
    {
      key: "route",
      header: "Route",
      cell: (slot) => (
        <span className="text-sm text-muted-foreground">
          {slot.departure_port} → {slot.arrival_port}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (slot) => {
        const items: RowActionItem[] = [
          {
            label: "Edit",
            icon: PencilIcon,
            permission: "ferry.update",
            onSelect: () => setDialogMode({ kind: "edit", schedule: slot }),
          },
          {
            label: "Archive",
            icon: Trash2Icon,
            permission: "ferry.delete",
            variant: "destructive",
            onSelect: () => setPendingDelete(slot),
          },
        ];
        return (
          <div className="flex items-center justify-end gap-2">
            {canUpdate || canDelete ? <RowActions items={items} /> : null}
          </div>
        );
      },
    },
  ];

  const emptyState = (
    <EmptyState
      icon={CalendarRangeIcon}
      title={
        filterFerryId !== "all"
          ? "No slots for this ferry"
          : "No ferry slots yet"
      }
      description={
        canCreate
          ? filterFerryId !== "all"
            ? "Create a slot to start taking bookings on this vessel."
            : "Pick a ferry first, then create a slot — slots live under their parent vessel."
          : "Slots will appear here once an administrator adds them."
      }
      action={
        canCreate && filterFerryId !== "all" ? (
          <Button size="sm" onClick={() => setDialogMode({ kind: "create" })}>
            <PlusIcon />
            New slot
          </Button>
        ) : null
      }
    />
  );

  const handleDialogSuccess = () => {
    setDialogMode(null);
    void load();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteFerrySchedule(pendingDelete.id);
      toast.success("Slot archived.");
      const shouldStepBack = rows.length === 1 && meta && meta.current_page > 1;
      if (shouldStepBack) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        await load();
      }
    } catch (error) {
      const blocking = asFerryBlockingBookings(error);
      if (blocking) {
        setCascadeTarget({ slot: pendingDelete, conflict: blocking });
        setPendingDelete(null);
        return;
      }
      toastApiError(error);
      throw error;
    }
  };

  const confirmCascade = async () => {
    if (!cascadeTarget) return;
    try {
      const outcome = await cascadeArchiveFerrySchedule(
        cascadeTarget.slot.id,
      );
      const counts = outcome.kind === "cascaded" ? outcome.counts : {};
      const parts = ["Slot archived"];
      if (counts.bookings_cancelled) {
        parts.push(`${counts.bookings_cancelled} booking(s) cancelled`);
      }
      toast.success(parts.join(" · "));
      await load();
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  // For create dialogs only — needs a parent ferry. Button only shows when a
  // specific ferry is filtered, so this is safe.
  const createTargetFerryId =
    typeof filterFerryId === "number" ? filterFerryId : 0;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Ferry slots" },
        ]}
      />
      <PageHeader
        title="Ferry slots"
        description="Recurring departure windows across every vessel."
        actions={
          canCreate && filterFerryId !== "all" ? (
            <Button size="sm" onClick={() => setDialogMode({ kind: "create" })}>
              <PlusIcon />
              New slot
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label
            htmlFor="ferry-slot-ferry"
            className="block text-xs font-medium text-muted-foreground"
          >
            Ferry
          </label>
          <Select
            value={filterFerryId === "all" ? "all" : String(filterFerryId)}
            onValueChange={(next) =>
              setFilterFerryId(next === "all" ? "all" : Number(next))
            }
            disabled={ferriesLoading}
          >
            <SelectTrigger id="ferry-slot-ferry" className="w-72">
              <SelectValue
                placeholder={
                  ferriesLoading ? "Loading ferries…" : "All ferries"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ferries</SelectItem>
              {ferries.map((ferry) => (
                <SelectItem key={ferry.id} value={String(ferry.id)}>
                  {ferry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filterFerryId !== "all" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterFerryId("all")}
          >
            Clear filter
          </Button>
        ) : null}
      </div>

      {ferriesError ? (
        <p className="text-sm text-destructive">{ferriesError}</p>
      ) : null}

      <DataTable<FerrySchedule>
        columns={columns}
        rows={rows}
        state={state}
        getRowId={(slot) => slot.id}
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

      <FerryScheduleDialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null);
        }}
        ferryId={createTargetFerryId}
        mode={dialogMode ?? { kind: "create" }}
        onSuccess={handleDialogSuccess}
      />

      <ConfirmDialog
        open={pendingDelete !== null && canDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Archive slot ${formatTime(pendingDelete.departure_time)}–${formatTime(pendingDelete.arrival_time)}?`
            : "Archive slot?"
        }
        description="If any confirmed bookings reference this slot you'll be asked again before they're cancelled."
        confirmLabel="Archive"
        onConfirm={confirmDelete}
      />

      <FerryArchiveConfirm
        open={cascadeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCascadeTarget(null);
        }}
        resourceLabel={
          cascadeTarget
            ? `slot ${formatTime(cascadeTarget.slot.departure_time)}–${formatTime(cascadeTarget.slot.arrival_time)}`
            : "slot"
        }
        conflict={cascadeTarget?.conflict ?? null}
        onConfirm={confirmCascade}
      />
    </div>
  );
}
