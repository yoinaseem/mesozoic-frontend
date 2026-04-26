"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { FormPage } from "@/components/admin/FormPage";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createFerryType,
  updateFerryType,
  type FerryTypeInput,
} from "@/lib/api/ferry-types";
import type { FerryType } from "@/types/booking";

type FerryTypeFormMode =
  | { kind: "create"; initial?: undefined }
  | { kind: "edit"; initial: FerryType };

type Props = {
  mode: FerryTypeFormMode;
};

type FormState = {
  name: string;
  description: string;
  image: string;
  capacity: string;
  price: string;
};

function buildInitialState(initial?: FerryType): FormState {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    image: initial?.image ?? "",
    capacity: initial?.capacity != null ? String(initial.capacity) : "",
    price: initial?.price != null ? String(initial.price) : "",
  };
}

export function FerryTypeForm({ mode }: Props) {
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
    form.image !== snapshot.image ||
    form.capacity !== snapshot.capacity ||
    form.price !== snapshot.price;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (): FerryTypeInput => ({
    name: form.name,
    description: form.description || null,
    image: form.image || null,
    capacity: Number(form.capacity),
    price: Number(form.price),
  });

  const buildDiff = (): Partial<FerryTypeInput> => {
    const diff: Partial<FerryTypeInput> = {};
    if (form.name !== snapshot.name) diff.name = form.name;
    if (form.description !== snapshot.description) {
      diff.description = form.description || null;
    }
    if (form.image !== snapshot.image) diff.image = form.image || null;
    if (form.capacity !== snapshot.capacity) {
      diff.capacity = Number(form.capacity);
    }
    if (form.price !== snapshot.price) diff.price = Number(form.price);
    return diff;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    try {
      if (mode.kind === "create") {
        const res = await createFerryType(buildPayload());
        toast.success(`Created ${res.data.name}.`);
        router.push("/admin/ferries");
      } else {
        const res = await updateFerryType(mode.initial.id, buildDiff());
        toast.success(`Updated ${res.data.name}.`);
        router.push("/admin/ferries");
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
      title={isCreate ? "New ferry type" : `Edit ${mode.initial.name}`}
      description={
        isCreate
          ? "Add a new ferry catalogue entry. Vessels under this type inherit price and capacity."
          : "Update this ferry type. All vessels under it inherit the new values."
      }
      submitLabel={
        submitting
          ? isCreate
            ? "Creating…"
            : "Saving…"
          : isCreate
            ? "Create type"
            : "Save changes"
      }
      isDirty={isDirty}
      isSubmitting={submitting}
      formError={formError}
      onSubmit={onSubmit}
      onCancel={() => router.push("/admin/ferries")}
    >
      <FormField label="Name" name="name" errors={fieldErrors} required>
        <Input
          type="text"
          required
          maxLength={255}
          placeholder="e.g. Air Conditioned"
          value={form.name}
          onChange={(event) => setField("name", event.target.value)}
        />
      </FormField>

      <FormField label="Description" name="description" errors={fieldErrors}>
        <Textarea
          rows={3}
          placeholder="A brief description of this ferry class."
          value={form.description}
          onChange={(event) => setField("description", event.target.value)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Capacity"
          name="capacity"
          errors={fieldErrors}
          helper="Seats per vessel of this type"
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

        <FormField
          label="Price per seat"
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
      </div>

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
