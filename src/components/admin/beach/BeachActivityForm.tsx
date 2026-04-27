"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { FormPage } from "@/components/admin/FormPage";
import { ImageDropzone } from "@/components/admin/ImageDropzone";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createBeachActivity,
  updateBeachActivity,
  type BeachActivityInput,
} from "@/lib/api/beach-activities";
import type { BeachActivity } from "@/types/booking";

type BeachActivityFormMode =
  | { kind: "create"; initial?: undefined }
  | { kind: "edit"; initial: BeachActivity };

type BeachActivityFormProps = {
  mode: BeachActivityFormMode;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  capacity: string;
  duration: string;
  image: string;
};

function buildInitialState(initial?: BeachActivity): FormState {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price != null ? String(initial.price) : "",
    capacity: initial?.capacity != null ? String(initial.capacity) : "",
    duration: initial?.duration != null ? String(initial.duration) : "",
    image: initial?.image ?? "",
  };
}

export function BeachActivityForm({ mode }: BeachActivityFormProps) {
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
    form.capacity !== snapshot.capacity ||
    form.duration !== snapshot.duration ||
    form.image !== snapshot.image;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (): BeachActivityInput => ({
    name: form.name,
    description: form.description || null,
    price: Number(form.price),
    capacity: Number(form.capacity),
    duration: Number(form.duration),
    image: form.image || null,
  });

  const buildDiff = (): Partial<BeachActivityInput> => {
    const diff: Partial<BeachActivityInput> = {};
    if (form.name !== snapshot.name) diff.name = form.name;
    if (form.description !== snapshot.description) {
      diff.description = form.description || null;
    }
    if (form.price !== snapshot.price) diff.price = Number(form.price);
    if (form.capacity !== snapshot.capacity) {
      diff.capacity = Number(form.capacity);
    }
    if (form.duration !== snapshot.duration) {
      diff.duration = Number(form.duration);
    }
    if (form.image !== snapshot.image) diff.image = form.image || null;
    return diff;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    try {
      if (mode.kind === "create") {
        const res = await createBeachActivity(buildPayload());
        toast.success(`Created ${res.data.name}.`);
        router.push(`/admin/beach-activities/${res.data.id}`);
      } else {
        const res = await updateBeachActivity(mode.initial.id, buildDiff());
        toast.success(`Updated ${res.data.name}.`);
        router.push(`/admin/beach-activities/${mode.initial.id}`);
      }
    } catch (error) {
      setFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const isCreate = mode.kind === "create";

  return (
    <FormPage
      title={isCreate ? "New beach activity" : `Edit ${mode.initial.name}`}
      description={
        isCreate
          ? "Add a new beach activity to the catalogue."
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
      onCancel={() =>
        router.push(
          isCreate
            ? "/admin/beach-activities"
            : `/admin/beach-activities/${mode.initial.id}`,
        )
      }
    >
      <FormField label="Name" name="name" errors={fieldErrors} required>
        <Input
          type="text"
          required
          placeholder="Sunset Snorkel"
          value={form.name}
          onChange={(event) => setField("name", event.target.value)}
        />
      </FormField>

      <FormField label="Description" name="description" errors={fieldErrors}>
        <Textarea
          rows={3}
          placeholder="A brief description of this activity."
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
          label="Capacity"
          name="capacity"
          errors={fieldErrors}
          helper="Max guests per session"
          required
        >
          <Input
            type="number"
            min={1}
            required
            inputMode="numeric"
            value={form.capacity}
            onChange={(event) => setField("capacity", event.target.value)}
          />
        </FormField>
      </div>

      <FormField
        label="Duration"
        name="duration"
        errors={fieldErrors}
        helper="In minutes. UI default for new schedules; existing schedules keep their stored end time."
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

      <FormField
        label="Cover image"
        name="image"
        errors={fieldErrors}
        helper="Optional. JPEG, PNG, WEBP, or GIF up to 10 MB."
      >
        <ImageDropzone
          value={form.image || null}
          onChange={(next) => setField("image", next ?? "")}
          folder="beach-activities"
          initialValue={snapshot.image || null}
          initialPreviewUrl={mode.initial?.image_url ?? null}
        />
      </FormField>
    </FormPage>
  );
}
