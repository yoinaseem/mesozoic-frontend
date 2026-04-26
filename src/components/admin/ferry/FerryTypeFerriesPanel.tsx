"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PencilIcon, PlusIcon, ShipIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FerryArchiveConfirm } from "@/components/admin/ferry/FerryArchiveConfirm";
import { FerryDialog, type FerryDialogMode } from "@/components/admin/ferry/FerryDialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";
import { ApiError, toastApiError } from "@/lib/api-client";
import { deleteFerry } from "@/lib/api/ferries";
import {
  asFerryBlockingBookings,
  cascadeArchiveFerry,
  type BlockingBookingsConflict,
} from "@/lib/api/ferry-cascade-archive";
import { getFerryType } from "@/lib/api/ferry-types";
import type { Ferry, FerryType } from "@/types/booking";

// Mirrors RoomTypeRoomsPanel: an inline panel rendered when the parent type
// row is expanded. Lazily loads the type's ferries via `getFerryType` (which
// eager-loads the `ferries` relation per §7).

type Props = {
  ferryType: FerryType;
  showIds?: boolean;
  /** Bumped when the parent section needs to refresh on changes. */
  refreshTick?: number;
  onChanged: () => void;
};

export function FerryTypeFerriesPanel({
  ferryType,
  showIds = false,
  refreshTick = 0,
  onChanged,
}: Props) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("ferry.create");
  const canUpdate = hasPermission("ferry.update");
  const canDelete = hasPermission("ferry.delete");

  const [ferries, setFerries] = useState<Ferry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [dialogMode, setDialogMode] = useState<FerryDialogMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Ferry | null>(null);
  const [cascadeTarget, setCascadeTarget] = useState<{
    ferry: Ferry;
    conflict: BlockingBookingsConflict | null;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      // GET /ferry-types/{id} eager-loads the `ferries` relation per §7.
      const res = await getFerryType(ferryType.id);
      setFerries(res.data.ferries ?? []);
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setLoadError(error.message || "Failed to load ferries.");
      } else {
        setLoadError("Failed to load ferries.");
      }
      setFerries(null);
    } finally {
      setLoading(false);
    }
  }, [ferryType.id]);

  useEffect(() => {
    void load();
  }, [load, refreshTick]);

  const handleDialogSuccess = () => {
    setDialogMode(null);
    void load();
    onChanged();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteFerry(pendingDelete.id);
      toast.success(`Archived ${pendingDelete.name}.`);
      await load();
      onChanged();
    } catch (error) {
      const blocking = asFerryBlockingBookings(error);
      if (blocking) {
        setCascadeTarget({ ferry: pendingDelete, conflict: blocking });
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
      const outcome = await cascadeArchiveFerry(cascadeTarget.ferry.id);
      const counts = outcome.kind === "cascaded" ? outcome.counts : {};
      const parts = [`Archived ${cascadeTarget.ferry.name}`];
      if (counts.slots_archived) {
        parts.push(`${counts.slots_archived} slot(s) archived`);
      }
      if (counts.bookings_cancelled) {
        parts.push(`${counts.bookings_cancelled} booking(s) cancelled`);
      }
      toast.success(parts.join(" · "));
      await load();
      onChanged();
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          {ferryType.name} Ferries
        </p>
        {canCreate ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogMode({ kind: "create" })}
          >
            <PlusIcon />
            New ferry
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner className="size-5" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : !ferries || ferries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No ferries of this type yet.
          {canCreate ? " Use “New ferry” to add one." : ""}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                {showIds ? <th className="w-20 px-3 py-2">ID</th> : null}
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ferries.map((ferry) => (
                <tr
                  key={ferry.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => router.push(`/admin/ferries/${ferry.id}`)}
                >
                  {showIds ? (
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {ferry.id}
                    </td>
                  ) : null}
                  <td className="px-3 py-2 font-medium">{ferry.name}</td>
                  <td
                    className="px-3 py-2 text-right"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() =>
                          router.push(`/admin/ferries/${ferry.id}`)
                        }
                        aria-label={`Open ${ferry.name} dashboard`}
                        title="Open dashboard"
                      >
                        <ShipIcon />
                      </Button>
                      {canUpdate ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setDialogMode({
                              kind: "edit",
                              ferryId: ferry.id,
                              initialName: ferry.name,
                            })
                          }
                          aria-label={`Edit ferry ${ferry.name}`}
                        >
                          <PencilIcon />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setPendingDelete(ferry)}
                          aria-label={`Archive ferry ${ferry.name}`}
                        >
                          <Trash2Icon />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FerryDialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null);
        }}
        ferryTypeId={ferryType.id}
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
            ? `Archive ferry ${pendingDelete.name}?`
            : "Archive ferry?"
        }
        description="Archives the vessel and every slot under it. If any confirmed bookings exist you'll be asked again before they're cancelled."
        confirmLabel="Archive"
        onConfirm={confirmDelete}
      />

      <FerryArchiveConfirm
        open={cascadeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCascadeTarget(null);
        }}
        resourceLabel={
          cascadeTarget ? `ferry ${cascadeTarget.ferry.name}` : "ferry"
        }
        conflict={cascadeTarget?.conflict ?? null}
        onConfirm={confirmCascade}
      />
    </div>
  );
}
