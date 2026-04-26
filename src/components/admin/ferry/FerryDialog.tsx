"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, getValidationErrors, toastApiError } from "@/lib/api-client";
import { createFerry, updateFerry } from "@/lib/api/ferries";

// Mirrors RoomDialog: name-only create/edit. ferry_type_id is implicit from
// the panel context (the type whose row is currently expanded).
export type FerryDialogMode =
  | { kind: "create" }
  | { kind: "edit"; ferryId: number; initialName: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ferryTypeId: number;
  mode: FerryDialogMode;
  onSuccess: () => void;
};

export function FerryDialog({
  open,
  onOpenChange,
  ferryTypeId,
  mode,
  onSuccess,
}: Props) {
  const isEdit = mode.kind === "edit";
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    if (open) {
      setName(mode.kind === "edit" ? mode.initialName : "");
      setFieldError("");
    }
  }, [open, mode]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError("");
    setSubmitting(true);
    try {
      if (mode.kind === "create") {
        await createFerry({ name, ferry_type_id: ferryTypeId });
        toast.success(`Created ${name}.`);
      } else {
        // PATCH only sends `name` — type swaps aren't supported via this
        // dialog (mirrors how RoomDialog edit doesn't move rooms between types).
        await updateFerry(mode.ferryId, { name });
        toast.success(`Updated ${name}.`);
      }
      onSuccess();
    } catch (error) {
      // Pull the field-level message out of 422s for inline display next
      // to the input — same shape as RoomDialog.
      if (error instanceof ApiError && error.status === 422) {
        const errors = getValidationErrors(error);
        setFieldError(
          errors.name?.[0] ??
            errors.ferry_type_id?.[0] ??
            "Please check the details and try again.",
        );
      } else {
        toastApiError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const trimmed = name.trim();
  const saveDisabled =
    submitting ||
    trimmed === "" ||
    (isEdit && mode.kind === "edit" && trimmed === mode.initialName);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !submitting && onOpenChange(next)}
    >
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit ferry" : "New ferry"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <label htmlFor="ferry-name" className="block text-sm font-medium">
              Name
            </label>
            <Input
              id="ferry-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Isla Express II"
              required
              autoFocus
              maxLength={255}
              aria-invalid={fieldError ? true : undefined}
            />
            {fieldError ? (
              <p className="text-sm text-destructive">{fieldError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveDisabled}>
              {submitting ? <Spinner /> : null}
              {isEdit ? "Save" : "Create ferry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
