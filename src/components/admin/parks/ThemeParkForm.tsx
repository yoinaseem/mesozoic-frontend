"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { FormPage } from "@/components/admin/FormPage";
import { ImageDropzoneMulti } from "@/components/admin/ImageDropzoneMulti";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { asCapacityLower } from "@/lib/api/park-cascade";
import {
  createThemePark,
  updateThemePark,
  type ThemeParkInput,
} from "@/lib/api/theme-parks";
import type { ThemePark } from "@/types/booking";

type ThemeParkFormMode =
  | { kind: "create"; initial?: undefined }
  | { kind: "edit"; initial: ThemePark };

type ThemeParkFormProps = {
  mode: ThemeParkFormMode;
};

type FormState = {
  name: string;
  description: string;
  capacity: string;
  price: string;
  contact_email: string;
  contact_phone: string;
  images: string[];
};

function buildInitialState(initial?: ThemePark): FormState {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    capacity: initial?.capacity != null ? String(initial.capacity) : "",
    price: initial?.price != null ? String(initial.price) : "",
    contact_email: initial?.contact_email ?? "",
    contact_phone: initial?.contact_phone ?? "",
    images: initial?.images ?? [],
  };
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function ThemeParkForm({ mode }: ThemeParkFormProps) {
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
    form.capacity !== snapshot.capacity ||
    form.price !== snapshot.price ||
    form.contact_email !== snapshot.contact_email ||
    form.contact_phone !== snapshot.contact_phone ||
    !arraysEqual(form.images, snapshot.images);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (): ThemeParkInput => ({
    name: form.name,
    description: form.description,
    capacity: Number(form.capacity),
    price: Number(form.price),
    contact_email: form.contact_email,
    contact_phone: form.contact_phone,
    images: form.images.length === 0 ? null : form.images,
  });

  const buildDiff = (): Partial<ThemeParkInput> => {
    const diff: Partial<ThemeParkInput> = {};
    if (form.name !== snapshot.name) diff.name = form.name;
    if (form.description !== snapshot.description) {
      diff.description = form.description;
    }
    if (form.capacity !== snapshot.capacity) {
      diff.capacity = Number(form.capacity);
    }
    if (form.price !== snapshot.price) diff.price = Number(form.price);
    if (form.contact_email !== snapshot.contact_email) {
      diff.contact_email = form.contact_email;
    }
    if (form.contact_phone !== snapshot.contact_phone) {
      diff.contact_phone = form.contact_phone;
    }
    if (!arraysEqual(form.images, snapshot.images)) {
      diff.images = form.images.length === 0 ? null : form.images;
    }
    return diff;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    try {
      if (mode.kind === "create") {
        const res = await createThemePark(buildPayload());
        toast.success(`Created ${res.data.name}.`);
        router.push(`/admin/parks/${res.data.id}`);
      } else {
        const res = await updateThemePark(mode.initial.id, buildDiff());
        toast.success(`Updated ${res.data.name}.`);
        router.push(`/admin/parks/${mode.initial.id}`);
      }
    } catch (error) {
      // DESD-95: lowering park.capacity below any child activity's
      // max_capacity returns 409 with the offenders. Surface them so the
      // operator knows what to lower first.
      const capacity = asCapacityLower(error);
      if (capacity) {
        const list = capacity.offending_activities
          .map((a) => `${a.name} (${a.max_capacity})`)
          .join(", ");
        toast.error(
          `Cannot lower capacity below: ${list}. Lower those activities' max capacity first.`,
        );
      } else {
        setFromApiError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isCreate = mode.kind === "create";

  return (
    <FormPage
      title={isCreate ? "New park" : `Edit ${mode.initial.name}`}
      description={
        isCreate
          ? "Add a new theme park to the isle."
          : "Update this park's details."
      }
      submitLabel={
        submitting
          ? isCreate
            ? "Creating…"
            : "Saving…"
          : isCreate
            ? "Create park"
            : "Save changes"
      }
      isDirty={isDirty}
      isSubmitting={submitting}
      formError={formError}
      onSubmit={onSubmit}
      onCancel={() =>
        router.push(
          isCreate ? "/admin/parks" : `/admin/parks/${mode.initial.id}`,
        )
      }
    >
      <FormField label="Name" name="name" errors={fieldErrors} required>
        <Input
          type="text"
          required
          placeholder="Mesozoic Theme Park"
          value={form.name}
          onChange={(event) => setField("name", event.target.value)}
        />
      </FormField>

      <FormField
        label="Description"
        name="description"
        errors={fieldErrors}
        required
      >
        <Textarea
          rows={4}
          required
          placeholder="A brief description of the park."
          value={form.description}
          onChange={(event) => setField("description", event.target.value)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Capacity"
          name="capacity"
          errors={fieldErrors}
          helper={
            mode.kind === "edit" && mode.initial.activities?.length
              ? "Maximum guests per day. Cannot be lowered below any activity's max capacity."
              : "Maximum guests per day"
          }
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Contact email"
          name="contact_email"
          errors={fieldErrors}
          required
        >
          <Input
            type="email"
            required
            placeholder="contact@mesozoic.test"
            value={form.contact_email}
            onChange={(event) => setField("contact_email", event.target.value)}
          />
        </FormField>

        <FormField
          label="Contact phone"
          name="contact_phone"
          errors={fieldErrors}
          required
        >
          <Input
            type="tel"
            required
            placeholder="+960-000-0000"
            value={form.contact_phone}
            onChange={(event) => setField("contact_phone", event.target.value)}
          />
        </FormField>
      </div>

      <FormField
        label="Cover images"
        name="images"
        errors={fieldErrors}
        helper="Optional. JPEG, PNG, WEBP, or GIF up to 10 MB each."
      >
        <ImageDropzoneMulti
          value={form.images}
          onChange={(next) => setField("images", next)}
          folder="theme-parks"
          initialValue={snapshot.images}
          initialPreviewUrls={mode.initial?.image_urls ?? undefined}
        />
      </FormField>
    </FormPage>
  );
}
