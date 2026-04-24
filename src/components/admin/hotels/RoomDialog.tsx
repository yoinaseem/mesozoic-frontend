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
import { createRoom, updateRoom } from "@/lib/api/rooms";

export type RoomDialogMode =
  | { kind: "create" }
  | { kind: "edit"; roomId: number; initialRoomNo: string };

type RoomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: number;
  roomTypeId: number;
  mode: RoomDialogMode;
  onSuccess: () => void;
};

export function RoomDialog({
  open,
  onOpenChange,
  hotelId,
  roomTypeId,
  mode,
  onSuccess,
}: RoomDialogProps) {
  const isEdit = mode.kind === "edit";
  const [roomNo, setRoomNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    if (open) {
      setRoomNo(mode.kind === "edit" ? mode.initialRoomNo : "");
      setFieldError("");
    }
  }, [open, mode]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError("");
    setSubmitting(true);
    try {
      if (mode.kind === "create") {
        await createRoom(hotelId, {
          room_no: roomNo,
          room_type_id: roomTypeId,
        });
        toast.success(`Created room ${roomNo}.`);
      } else {
        await updateRoom(hotelId, mode.roomId, { room_no: roomNo });
        toast.success(`Updated room ${roomNo}.`);
      }
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const errors = getValidationErrors(error);
        setFieldError(
          errors.room_no?.[0] ??
            errors.room_type_id?.[0] ??
            "Please check the details and try again.",
        );
      } else {
        toastApiError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const trimmed = roomNo.trim();
  const saveDisabled =
    submitting ||
    trimmed === "" ||
    (isEdit && mode.kind === "edit" && trimmed === mode.initialRoomNo);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !submitting && onOpenChange(next)}
    >
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit room" : "New room"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <label htmlFor="room-no" className="block text-sm font-medium">
              Room number
            </label>
            <Input
              id="room-no"
              value={roomNo}
              onChange={(event) => setRoomNo(event.target.value)}
              placeholder="e.g. 101"
              required
              autoFocus
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
              {isEdit ? "Save" : "Create room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
