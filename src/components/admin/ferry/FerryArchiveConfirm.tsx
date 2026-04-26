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
import type { BlockingBookingsConflict } from "@/lib/api/ferry-cascade-archive";

// Two-step archive prompt for ferry domain (types / vessels / slots):
//
//  1. Plain DELETE — no confirmation in the dialog state, the caller wraps
//     this dialog around its own outer ConfirmDialog for the routine prompt.
//  2. If the API returns 409 with a `blocking_bookings` count, the caller
//     hands the parsed conflict to this dialog. Operator sees how many
//     bookings would be cancelled and can either bail or proceed; on
//     proceed, `onConfirm` re-issues the DELETE with on_conflict=cascade.

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What's being archived (e.g. "ferry type Air Conditioned"). */
  resourceLabel: string;
  conflict: BlockingBookingsConflict | null;
  onConfirm: () => Promise<void>;
};

export function FerryArchiveConfirm({
  open,
  onOpenChange,
  resourceLabel,
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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !confirming && onOpenChange(next)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive {resourceLabel}?</DialogTitle>
          <DialogDescription>
            {conflict ? (
              <>
                <strong>{conflict.blocking_bookings}</strong> confirmed
                booking(s) reference this row. If you proceed, those bookings
                will be cancelled and the row archived in one transaction.
                This cannot be undone from the admin UI.
              </>
            ) : (
              "Confirm to cascade the archive."
            )}
          </DialogDescription>
        </DialogHeader>

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
            Archive & cancel bookings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
