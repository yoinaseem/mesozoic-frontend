"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { FormPage } from "@/components/admin/FormPage";
import { ImageDropzone } from "@/components/admin/ImageDropzone";
import { TagInput } from "@/components/admin/TagInput";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createRoomType,
  updateRoomType,
  type RoomTypeInput,
} from "@/lib/api/room-types";
import type { RoomType } from "@/types/booking";

type RoomTypeFormMode =
  | { kind: "create"; initial?: undefined }
  | { kind: "edit"; initial: RoomType };

type RoomTypeFormProps = {
  hotelId: number;
  mode: RoomTypeFormMode;
};

type FormState = {
  name: string;
  description: string;
  capacity: string;
  price: string;
  amenities: string[];
  image: string;
};

function priceToInput(price: string | null | undefined): string {
  if (!price) return "";
  const n = parseFloat(price);
  if (Number.isNaN(n)) return "";
  return n.toString();
}

function buildInitialState(initial?: RoomType): FormState {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    capacity: initial?.capacity != null ? String(initial.capacity) : "",
    price: priceToInput(initial?.price),
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

export function RoomTypeForm({ hotelId, mode }: RoomTypeFormProps) {
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
    !arraysEqual(form.amenities, snapshot.amenities) ||
    form.image !== snapshot.image;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (): RoomTypeInput => {
    // Full payload for create mode
    return {
      name: form.name,
      description: form.description || null,
      capacity: form.capacity === "" ? null : Number(form.capacity),
      price: form.price === "" ? null : Number(form.price),
      amenities: form.amenities.length === 0 ? null : form.amenities,
      image: form.image || null,
    };
  };

  const buildDiff = (): Partial<RoomTypeInput> => {
    const diff: Partial<RoomTypeInput> = {};
    if (form.name !== snapshot.name) diff.name = form.name;
    if (form.description !== snapshot.description) {
      diff.description = form.description || null;
    }
    if (form.capacity !== snapshot.capacity) {
      diff.capacity = form.capacity === "" ? null : Number(form.capacity);
    }
    if (form.price !== snapshot.price) {
      diff.price = form.price === "" ? null : Number(form.price);
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
        await createRoomType(hotelId, buildPayload());
        toast.success(`Created ${form.name}.`);
      } else {
        await updateRoomType(hotelId, mode.initial.id, buildDiff());
        toast.success(`Updated ${form.name}.`);
      }
      router.push(`/admin/hotels/${hotelId}?tab=room-types`);
    } catch (error) {
      setFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const isCreate = mode.kind === "create";

  return (
    <FormPage
      title={isCreate ? "New room type" : `Edit ${mode.initial.name}`}
      description={
        isCreate
          ? "Add a new category of room to this hotel."
          : "Update this room type's details."
      }
      submitLabel={
        submitting
          ? isCreate
            ? "Creating…"
            : "Saving…"
          : isCreate
            ? "Create room type"
            : "Save changes"
      }
      isDirty={isDirty}
      isSubmitting={submitting}
      formError={formError}
      onSubmit={onSubmit}
      onCancel={() => router.push(`/admin/hotels/${hotelId}?tab=room-types`)}
    >
      <FormField label="Name" name="name" errors={fieldErrors} required>
        <Input
          type="text"
          required
          placeholder="Deluxe Suite"
          value={form.name}
          onChange={(event) => setField("name", event.target.value)}
        />
      </FormField>

      <FormField label="Description" name="description" errors={fieldErrors}>
        <Textarea
          rows={3}
          placeholder="A brief description of this room type."
          value={form.description}
          onChange={(event) => setField("description", event.target.value)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Capacity"
          name="capacity"
          errors={fieldErrors}
          helper="Guests per room"
        >
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={form.capacity}
            onChange={(event) => setField("capacity", event.target.value)}
          />
        </FormField>

        <FormField
          label="Price per night"
          name="price"
          errors={fieldErrors}
          helper="In USD"
        >
          <Input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={form.price}
            onChange={(event) => setField("price", event.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Amenities" name="amenities" errors={fieldErrors}>
        <TagInput
          value={form.amenities}
          onChange={(next) => setField("amenities", next)}
          placeholder="Add an amenity and press Enter…"
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
          folder="room-types"
          initialValue={snapshot.image || null}
          initialPreviewUrl={mode.initial?.image_url ?? null}
        />
      </FormField>
    </FormPage>
  );
}
