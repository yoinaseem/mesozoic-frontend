"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import {
  ChevronRightIcon,
  HashIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { RowActions, type RowActionItem } from "@/components/admin/RowActions";
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
import { toastApiError } from "@/lib/api-client";
import { deleteParkActivity } from "@/lib/api/park-activities";
import { cn } from "@/lib/utils";
import type { ParkActivity, ThemePark } from "@/types/booking";

import { ParkActivitySchedulesPanel } from "./ParkActivitySchedulesPanel";

type ParkActivitiesSectionProps = {
  park: ThemePark;
  onChanged: () => void;
};

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function formatDuration(minutes: number | null, isAllDay: boolean): string {
  if (isAllDay) return "All day";
  if (minutes == null) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
  return `${mins}m`;
}

export function ParkActivitiesSection({
  park,
  onChanged,
}: ParkActivitiesSectionProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("park.create");
  const [pendingDelete, setPendingDelete] = useState<ParkActivity | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showIds, setShowIds] = useState(false);
  const [schedulesTick, setSchedulesTick] = useState(0);

  const activities = park.activities ?? [];
  const columnCount = showIds ? 7 : 6;

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteParkActivity(park.id, pendingDelete.id);
      toast.success(`Deleted ${pendingDelete.name}.`);
      setExpanded((prev) => {
        if (!prev.has(pendingDelete.id)) return prev;
        const next = new Set(prev);
        next.delete(pendingDelete.id);
        return next;
      });
      onChanged();
    } catch (error) {
      toastApiError(error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Activities</h2>
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
              <Link href={`/admin/parks/${park.id}/activities/new`}>
                <PlusIcon />
                New activity
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-xl border">
          <EmptyState
            icon={SparklesIcon}
            title="No activities yet"
            description={
              canCreate
                ? "Create an activity to start scheduling sessions."
                : "Activities will appear here once an administrator adds them."
            }
            action={
              canCreate ? (
                <Button asChild size="sm">
                  <Link href={`/admin/parks/${park.id}/activities/new`}>
                    <PlusIcon />
                    New activity
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
                {showIds ? (
                  <TableHead className="w-[5rem]">ID</TableHead>
                ) : null}
                <TableHead>Name</TableHead>
                <TableHead className="w-[6rem]">Capacity</TableHead>
                <TableHead className="w-[7rem]">Duration</TableHead>
                <TableHead className="w-[8rem]">Price / guest</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => {
                const isExpanded = expanded.has(activity.id);
                const rowActions: RowActionItem[] = [
                  {
                    label: "Edit activity",
                    icon: PencilIcon,
                    permission: "park.update",
                    onSelect: () =>
                      router.push(
                        `/admin/parks/${park.id}/activities/${activity.id}/edit`,
                      ),
                  },
                  {
                    label: "Delete activity",
                    icon: Trash2Icon,
                    permission: "park.delete",
                    variant: "destructive",
                    onSelect: () => setPendingDelete(activity),
                  },
                ];

                return (
                  <Fragment key={activity.id}>
                    <TableRow
                      onClick={() => toggleExpand(activity.id)}
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
                          {activity.id}
                        </TableCell>
                      ) : null}
                      <TableCell className="font-medium">
                        {activity.name}
                      </TableCell>
                      <TableCell>{activity.max_capacity ?? "—"}</TableCell>
                      <TableCell>
                        {formatDuration(activity.duration, activity.is_all_day)}
                      </TableCell>
                      <TableCell>{formatPrice(activity.price)}</TableCell>
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
                          <ParkActivitySchedulesPanel
                            parkId={park.id}
                            activity={activity}
                            showIds={showIds}
                            tick={schedulesTick}
                            onChanged={() => {
                              setSchedulesTick((t) => t + 1);
                              onChanged();
                            }}
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

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete
            ? `Delete ${pendingDelete.name}?`
            : "Delete activity?"
        }
        description="This will also delete all schedules under this activity. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
