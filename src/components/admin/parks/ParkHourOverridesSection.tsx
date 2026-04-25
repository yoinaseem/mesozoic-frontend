"use client";

import { useCallback, useEffect, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { CalendarOffIcon } from "lucide-react";
import { ApiError, toastApiError } from "@/lib/api-client";
import {
  deleteParkHourOverride,
  listParkHourOverrides,
} from "@/lib/api/park-hour-overrides";
import type { Paginated } from "@/types/auth";
import type { ParkHourOverride } from "@/types/booking";

import {
  ParkHourOverrideDialog,
  type ParkHourOverrideDialogMode,
} from "./ParkHourOverrideDialog";

function formatTime(value: string | null): string {
  if (!value) return "—";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

type Props = {
  parkId: number;
  tick: number;
  onChanged: () => void;
};

export function ParkHourOverridesSection({ parkId, tick, onChanged }: Props) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("park.create");
  const canUpdate = hasPermission("park.update");
  const canDelete = hasPermission("park.delete");

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<ParkHourOverride> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [dialogMode, setDialogMode] =
    useState<ParkHourOverrideDialogMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ParkHourOverride | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await listParkHourOverrides(parkId, page);
      setResult(res);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setLoadError(error.message || "Failed to load overrides.");
      } else {
        setLoadError("Failed to load overrides.");
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [parkId, page]);

  useEffect(() => {
    void load();
  }, [load, tick]);

  const rows = result?.data ?? [];
  const meta = result?.meta;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteParkHourOverride(parkId, pendingDelete.id);
      toast.success(`Removed override for ${pendingDelete.date}.`);
      await load();
      onChanged();
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  const handleSuccess = () => {
    setDialogMode(null);
    void load();
    onChanged();
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium">Per-date overrides</h2>
          <p className="text-sm text-muted-foreground">
            One-off exceptions to the weekday baseline. Override wins over
            baseline.
          </p>
        </div>
        {canCreate ? (
          <Button size="sm" onClick={() => setDialogMode({ kind: "create" })}>
            <PlusIcon />
            New override
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-5" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border">
          <EmptyState
            icon={CalendarOffIcon}
            title="No overrides yet"
            description={
              canCreate
                ? "Use overrides for holidays, special events, or one-day closures."
                : "Overrides will appear here once an administrator adds them."
            }
            action={
              canCreate ? (
                <Button
                  size="sm"
                  onClick={() => setDialogMode({ kind: "create" })}
                >
                  <PlusIcon />
                  New override
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
                <TableHead className="w-36">Date</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-24">Open</TableHead>
                <TableHead className="w-24">Close</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((override) => (
                <TableRow key={override.id}>
                  <TableCell className="font-medium">{override.date}</TableCell>
                  <TableCell>
                    {override.is_closed ? (
                      <StatusBadge variant="destructive">Closed</StatusBadge>
                    ) : (
                      <StatusBadge variant="success">Open</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>{formatTime(override.open_time)}</TableCell>
                  <TableCell>{formatTime(override.close_time)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {override.note ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canUpdate ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setDialogMode({ kind: "edit", override })
                          }
                          aria-label={`Edit override for ${override.date}`}
                        >
                          <PencilIcon />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setPendingDelete(override)}
                          aria-label={`Delete override for ${override.date}`}
                        >
                          <Trash2Icon />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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

      <ParkHourOverrideDialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null);
        }}
        parkId={parkId}
        mode={dialogMode ?? { kind: "create" }}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Delete override for ${pendingDelete.date}?`
            : "Delete override?"
        }
        description="The date will fall back to the weekday baseline."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </section>
  );
}
