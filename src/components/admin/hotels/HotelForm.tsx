"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { FormPage } from "@/components/admin/FormPage";
import { TagInput } from "@/components/admin/TagInput";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createHotel, updateHotel, type HotelInput } from "@/lib/api/hotels";
import type { Hotel } from "@/types/booking";

type HotelFormMode =
  | { kind: "create"; initial?: undefined }
  | { kind: "edit"; initial: Hotel };

type HotelFormProps = {
  mode: HotelFormMode;
};

type FormState = {
  name: string;
  address: string;
  description: string;
  amenities: string[];
  image: string;
};

function buildInitialState(initial?: Hotel): FormState {
  return {
    name: initial?.name ?? "",
    address: initial?.address ?? "",
    description: initial?.description ?? "",
    amenities: initial?.amenities ?? [],
    image: initial?.image ?? "",
  };
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function HotelForm({ mode }: HotelFormProps) {
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
    form.address !== snapshot.address ||
    form.description !== snapshot.description ||
    !arraysEqual(form.amenities, snapshot.amenities) ||
    form.image !== snapshot.image;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (): HotelInput => ({
    name: form.name,
    address: form.address || null,
    description: form.description || null,
    amenities: form.amenities.length === 0 ? null : form.amenities,
    image: form.image || null,
  });

  const buildDiff = (): Partial<HotelInput> => {
    const diff: Partial<HotelInput> = {};
    if (form.name !== snapshot.name) diff.name = form.name;
    if (form.address !== snapshot.address) {
      diff.address = form.address || null;
    }
    if (form.description !== snapshot.description) {
      diff.description = form.description || null;
    }
    if (!arraysEqual(form.amenities, snapshot.amenities)) {
      diff.amenities = form.amenities.length === 0 ? null : form.amenities;
    }
    if (form.image !== snapshot.image) {
      diff.image = form.image || null;
    }
    return diff;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    try {
      if (mode.kind === "create") {
        const res = await createHotel(buildPayload());
        toast.success(`Created ${res.data.name}.`);
        router.push(`/admin/hotels/${res.data.id}`);
      } else {
        const res = await updateHotel(mode.initial.id, buildDiff());
        toast.success(`Updated ${res.data.name}.`);
        router.push(`/admin/hotels/${mode.initial.id}`);
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
      title={isCreate ? "New hotel" : `Edit ${mode.initial.name}`}
      description={
        isCreate
          ? "Add a new hotel to the isle."
          : "Update this hotel's details."
      }
      submitLabel={
        submitting
          ? isCreate
            ? "Creating…"
            : "Saving…"
          : isCreate
            ? "Create hotel"
            : "Save changes"
      }
      isDirty={isDirty}
      isSubmitting={submitting}
      formError={formError}
      onSubmit={onSubmit}
      onCancel={() =>
        router.push(
          isCreate ? "/admin/hotels" : `/admin/hotels/${mode.initial.id}`,
        )
      }
    >
      <FormField label="Name" name="name" errors={fieldErrors} required>
        <Input
          type="text"
          required
          placeholder="Mesozoic Grand Hotel"
          value={form.name}
          onChange={(event) => setField("name", event.target.value)}
        />
      </FormField>

      <FormField label="Address" name="address" errors={fieldErrors}>
        <Input
          type="text"
          placeholder="123 Island Road"
          value={form.address}
          onChange={(event) => setField("address", event.target.value)}
        />
      </FormField>

      <FormField label="Description" name="description" errors={fieldErrors}>
        <Textarea
          rows={4}
          placeholder="A brief description of the hotel."
          value={form.description}
          onChange={(event) => setField("description", event.target.value)}
        />
      </FormField>

      <FormField label="Amenities" name="amenities" errors={fieldErrors}>
        <TagInput
          value={form.amenities}
          onChange={(next) => setField("amenities", next)}
          placeholder="Add an amenity and press Enter…"
        />
      </FormField>

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
