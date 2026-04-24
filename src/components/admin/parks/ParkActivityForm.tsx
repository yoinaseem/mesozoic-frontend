"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { FormPage } from "@/components/admin/FormPage";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createParkActivity,
  updateParkActivity,
  type ParkActivityInput,
} from "@/lib/api/park-activities";
import type { ParkActivity } from "@/types/booking";

type ParkActivityFormMode =
  | { kind: "create"; initial?: undefined }
  | { kind: "edit"; initial: ParkActivity };

type ParkActivityFormProps = {
  parkId: number;
  mode: ParkActivityFormMode;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  image: string;
  duration: string;
  max_capacity: string;
  is_all_day: boolean;
};

function buildInitialState(initial?: ParkActivity): FormState {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price != null ? String(initial.price) : "",
    image: initial?.image ?? "",
    duration: initial?.duration != null ? String(initial.duration) : "",
    max_capacity:
      initial?.max_capacity != null ? String(initial.max_capacity) : "",
    is_all_day: initial?.is_all_day ?? false,
  };
}

export function ParkActivityForm({ parkId, mode }: ParkActivityFormProps) {
  const router = useRouter();
  const snapshot = useMemo(
    () => buildInitialState(mode.initial),
    [mode.initial],
  );

  const [form, setForm] = useState<FormState>(snapshot);
  const [submitting, setSubmitting] = useState(false);

  const { formError, fieldErrors, reset, setFromApiError } = useFieldErrors();

  const isDirty =
    form.name !== snapshot.name ||
    form.description !== snapshot.description ||
    form.price !== snapshot.price ||
    form.image !== snapshot.image ||
    form.duration !== snapshot.duration ||
    form.max_capacity !== snapshot.max_capacity ||
    form.is_all_day !== snapshot.is_all_day;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // When the activity is all-day, server forces duration to null — so we
  // stop sending it and clear the input to keep the two in sync client-side.
  const isAllDay = form.is_all_day;

  const buildPayload = (): ParkActivityInput => ({
    name: form.name,
    description: form.description || null,
    price: Number(form.price),
    image: form.image || null,
    duration: isAllDay
      ? null
      : form.duration === ""
        ? null
        : Number(form.duration),
    max_capacity: Number(form.max_capacity),
    is_all_day: isAllDay,
  });

  const buildDiff = (): Partial<ParkActivityInput> => {
    const diff: Partial<ParkActivityInput> = {};
    if (form.name !== snapshot.name) diff.name = form.name;
    if (form.description !== snapshot.description) {
      diff.description = form.description || null;
    }
    if (form.price !== snapshot.price) diff.price = Number(form.price);
    if (form.image !== snapshot.image) diff.image = form.image || null;
    if (form.is_all_day !== snapshot.is_all_day) {
      diff.is_all_day = form.is_all_day;
    }
    if (form.duration !== snapshot.duration || isAllDay !== snapshot.is_all_day) {
      diff.duration = isAllDay
        ? null
        : form.duration === ""
          ? null
          : Number(form.duration);
    }
    if (form.max_capacity !== snapshot.max_capacity) {
      diff.max_capacity = Number(form.max_capacity);
    }
    return diff;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    try {
      if (mode.kind === "create") {
        await createParkActivity(parkId, buildPayload());
        toast.success(`Created ${form.name}.`);
      } else {
        await updateParkActivity(parkId, mode.initial.id, buildDiff());
        toast.success(`Updated ${form.name}.`);
      }
      router.push(`/admin/parks/${parkId}`);
    } catch (error) {
      setFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const isCreate = mode.kind === "create";

  return (
    <FormPage
      title={isCreate ? "New activity" : `Edit ${mode.initial.name}`}
      description={
        isCreate
          ? "Add a new activity to this park."
          : "Update this activity's details."
      }
      submitLabel={
        submitting
          ? isCreate
            ? "Creating…"
            : "Saving…"
          : isCreate
            ? "Create activity"
            : "Save changes"
      }
      isDirty={isDirty}
      isSubmitting={submitting}
      formError={formError}
      onSubmit={onSubmit}
      onCancel={() => router.push(`/admin/parks/${parkId}`)}
    >
      <FormField label="Name" name="name" errors={fieldErrors} required>
        <Input
          type="text"
          required
          placeholder="Jurassic River Rafting"
          value={form.name}
          onChange={(event) => setField("name", event.target.value)}
        />
      </FormField>

      <FormField label="Description" name="description" errors={fieldErrors}>
        <Textarea
          rows={3}
          placeholder="A brief description of the activity."
          value={form.description}
          onChange={(event) => setField("description", event.target.value)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Price per guest"
          name="price"
          errors={fieldErrors}
          helper="In USD"
          required
        >
          <Input
            type="number"
            min={0}
            step="0.01"
            required
            inputMode="decimal"
            value={form.price}
            onChange={(event) => setField("price", event.target.value)}
          />
        </FormField>

        <FormField
          label="Max capacity"
          name="max_capacity"
          errors={fieldErrors}
          helper="Concurrent guests per session"
          required
        >
          <Input
            type="number"
            min={1}
            required
            inputMode="numeric"
            value={form.max_capacity}
            onChange={(event) => setField("max_capacity", event.target.value)}
          />
        </FormField>
      </div>

      <FormField label="All-day activity" name="is_all_day" errors={fieldErrors}>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.is_all_day}
            onCheckedChange={(value) =>
              setField("is_all_day", value === true)
            }
          />
          <span>Runs for the whole park day (no fixed duration)</span>
        </label>
      </FormField>

      {!isAllDay ? (
        <FormField
          label="Duration"
          name="duration"
          errors={fieldErrors}
          helper="In minutes. Required for timed activities."
          required
        >
          <Input
            type="number"
            min={1}
            required
            inputMode="numeric"
            value={form.duration}
            onChange={(event) => setField("duration", event.target.value)}
          />
        </FormField>
      ) : null}

      <FormField
        label="Image URL"
        name="image"
        errors={fieldErrors}
        helper="Optional. Paste a full URL to a cover image."
      >
        <Input
          type="url"
          placeholder="https://..."
          value={form.image}
          onChange={(event) => setField("image", event.target.value)}
        />
      </FormField>
    </FormPage>
  );
}
