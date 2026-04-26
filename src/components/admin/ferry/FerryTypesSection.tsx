"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";
import {
  ChevronRightIcon,
  HashIcon,
  LayersIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
import { FerryArchiveConfirm } from "@/components/admin/ferry/FerryArchiveConfirm";
import { FerryTypeFerriesPanel } from "@/components/admin/ferry/FerryTypeFerriesPanel";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { ApiError, toastApiError } from "@/lib/api-client";
import { deleteFerryType, listFerryTypes } from "@/lib/api/ferry-types";
import {
  asFerryBlockingBookings,
  cascadeArchiveFerryType,
  type BlockingBookingsConflict,
} from "@/lib/api/ferry-cascade-archive";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types/auth";
import type { FerryType } from "@/types/booking";

// Mirrors RoomTypesSection: a table of types with expandable rows. Each row
// expands to a panel showing the vessels under that type (akin to rooms
// under a room type).

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function FerryTypesSection() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("ferry.create");
  const canDelete = hasPermission("ferry.delete");

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<FerryType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showIds, setShowIds] = useState(false);
  // Bumped when a panel mutates so the section can refresh aggregates if it
  // ever needs to (e.g. a ferries_count column). Currently unused at the
  // section level but threaded so the panel + section stay in sync.
  const [panelTick, setPanelTick] = useState(0);

  const [pendingDelete, setPendingDelete] = useState<FerryType | null>(null);
  const [cascadeTarget, setCascadeTarget] = useState<{
    type: FerryType;
    conflict: BlockingBookingsConflict | null;
  } | null>(null);

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await listFerryTypes(nextPage);
      setResult(data);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setErrorMessage(error.message || "Failed to load ferry types.");
      } else {
        setErrorMessage("Failed to load ferry types.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const rows = result?.data ?? [];
  const meta = result?.meta;

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columnCount = showIds ? 6 : 5;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteFerryType(pendingDelete.id);
      toast.success(`Archived ${pendingDelete.name}.`);
      // Collapse a deleted row's expansion so a later create at the same id
      // doesn't surprise the operator with stale expansion state.
      setExpanded((prev) => {
        if (!prev.has(pendingDelete.id)) return prev;
        const next = new Set(prev);
        next.delete(pendingDelete.id);
        return next;
      });
      await load(page);
    } catch (error) {
      const blocking = asFerryBlockingBookings(error);
      if (blocking) {
        setCascadeTarget({ type: pendingDelete, conflict: blocking });
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
      const outcome = await cascadeArchiveFerryType(cascadeTarget.type.id);
      const counts = outcome.kind === "cascaded" ? outcome.counts : {};
      const parts = [`Archived ${cascadeTarget.type.name}`];
      if (counts.ferries_archived) {
        parts.push(`${counts.ferries_archived} ferry(ies) archived`);
      }
      if (counts.slots_archived) {
        parts.push(`${counts.slots_archived} slot(s) archived`);
      }
      if (counts.bookings_cancelled) {
        parts.push(`${counts.bookings_cancelled} booking(s) cancelled`);
      }
      toast.success(parts.join(" · "));
      setExpanded((prev) => {
        if (!prev.has(cascadeTarget.type.id)) return prev;
        const next = new Set(prev);
        next.delete(cascadeTarget.type.id);
        return next;
      });
      await load(page);
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  const state = loading
    ? "loading"
    : errorMessage
      ? "error"
      : rows.length === 0
        ? "empty"
        : "ready";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Ferry types</h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showIds ? "secondary" : "outline"}
            onClick={() => setShowIds((prev) => !prev)}
            aria-pressed={showIds}
          >
            <HashIcon />
            {showIds ? "Hide IDs" : "Show IDs"}
          </Button>
          {canCreate ? (
            <Button asChild size="sm">
              <Link href="/admin/ferries/types/new">
                <PlusIcon />
                New ferry type
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {state === "loading" ? (
        <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : state === "error" ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : state === "empty" ? (
        <div className="rounded-xl border">
          <EmptyState
            icon={LayersIcon}
            title="No ferry types yet"
            description={
              canCreate
                ? "Create the first ferry type — vessels are added underneath."
                : "Ferry types will appear here once an administrator adds them."
            }
            action={
              canCreate ? (
                <Button asChild size="sm">
                  <Link href="/admin/ferries/types/new">
                    <PlusIcon />
                    New ferry type
                  </Link>
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                {showIds ? <TableHead className="w-20">ID</TableHead> : null}
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Capacity</TableHead>
                <TableHead className="w-32">Price / seat</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((type) => {
                const isExpanded = expanded.has(type.id);
                const rowActions: RowActionItem[] = [
                  {
                    label: "Edit type",
                    icon: PencilIcon,
                    permission: "ferry.update",
                    onSelect: () =>
                      router.push(`/admin/ferries/types/${type.id}/edit`),
                  },
                  {
                    label: "Archive type",
                    icon: Trash2Icon,
                    permission: "ferry.delete",
                    variant: "destructive",
                    onSelect: () => setPendingDelete(type),
                  },
                ];

                return (
                  <Fragment key={type.id}>
                    <TableRow
                      onClick={() => toggleExpand(type.id)}
                      className="cursor-pointer"
                      aria-expanded={isExpanded}
                    >
                      <TableCell>
                        <ChevronRightIcon
                          className={cn(
                            "size-4 text-muted-foreground transition-transform",
                            isExpanded && "rotate-90",
                          )}
                          aria-hidden
                        />
                      </TableCell>
                      {showIds ? (
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {type.id}
                        </TableCell>
                      ) : null}
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.capacity}</TableCell>
                      <TableCell>{formatPrice(type.price)}</TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <RowActions items={rowActions} />
                      </TableCell>
                    </TableRow>
                    {isExpanded ? (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={columnCount} className="p-0">
                          <FerryTypeFerriesPanel
                            ferryType={type}
                            showIds={showIds}
                            refreshTick={panelTick}
                            onChanged={() => setPanelTick((t) => t + 1)}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && meta.last_page > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.current_page} of {meta.last_page} · {meta.total} total
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
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null && canDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Archive ferry type ${pendingDelete.name}?`
            : "Archive ferry type?"
        }
        description="Archives the type and every vessel + slot under it. If any confirmed bookings exist you'll be asked again before they're cancelled."
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
            ? `ferry type ${cascadeTarget.type.name}`
            : "ferry type"
        }
        conflict={cascadeTarget?.conflict ?? null}
        onConfirm={confirmCascade}
      />
    </div>
  );
}
