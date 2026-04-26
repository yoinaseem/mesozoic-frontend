"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { HoursCascadeResponse } from "@/lib/api/park-cascade";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: HoursCascadeResponse | null;
  /**
   * Caller re-runs the original mutation with `on_conflict: "cascade"`. Errors
   * propagate so the parent's error handler (typically `setFromApiError`) can
   * surface them in the originating form.
   */
  onConfirm: () => Promise<void>;
};

function formatTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

export function HoursCascadeDialog({
  open,
  onOpenChange,
  conflict,
  onConfirm,
}: Props) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setConfirming(false);
    }
  };

  const counts = conflict?.counts;
  const conflicts = conflict?.conflicts ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !confirming && onOpenChange(next)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>This change conflicts with existing schedules</DialogTitle>
          <DialogDescription>
            {counts ? (
              <>
                The new hours would invalidate{" "}
                <strong>{counts.schedules} schedule(s)</strong> and{" "}
                <strong>{counts.bookings} confirmed booking(s)</strong>. If you
                proceed, those schedules will be cancelled and their bookings
                cancelled with them. All-day activities whose date stays open
                will instead be re-synced to the new hours (their bookings stay
                confirmed).
              </>
            ) : (
              "Confirm to cascade the change."
            )}
          </DialogDescription>
        </DialogHeader>

        {conflicts.length > 0 ? (
          <div className="max-h-64 overflow-y-auto rounded-md border bg-muted/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="px-3 py-2">Schedule</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Window</th>
                  <th className="px-3 py-2 text-right">Bookings</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {conflicts.map((c) => (
                  <tr key={c.schedule_id}>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      #{c.schedule_id}
                    </td>
                    <td className="px-3 py-2">{c.date}</td>
                    <td className="px-3 py-2">
                      {formatTime(c.start_time)}–{formatTime(c.end_time)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {c.confirmed_bookings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirming ? <Spinner /> : null}
            Cascade & cancel bookings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
