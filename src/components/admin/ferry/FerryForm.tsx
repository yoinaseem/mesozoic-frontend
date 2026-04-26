"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { FormPage } from "@/components/admin/FormPage";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import {
  createFerry,
  updateFerry,
  type FerryInput,
} from "@/lib/api/ferries";
import { listFerryTypes } from "@/lib/api/ferry-types";
import type { Ferry, FerryType } from "@/types/booking";

type FerryFormMode =
  | { kind: "create"; initial?: undefined }
  | { kind: "edit"; initial: Ferry };

type Props = {
  mode: FerryFormMode;
};

type FormState = {
  name: string;
  ferry_type_id: string; // string while bound to <Select>; coerced on submit
};

function buildInitialState(initial?: Ferry): FormState {
  return {
    name: initial?.name ?? "",
    ferry_type_id:
      initial?.ferry_type_id != null ? String(initial.ferry_type_id) : "",
  };
}

export function FerryForm({ mode }: Props) {
  const router = useRouter();
  const snapshot = useMemo(
    () => buildInitialState(mode.initial),
    [mode.initial],
  );

  const [form, setForm] = useState<FormState>(snapshot);
  const [submitting, setSubmitting] = useState(false);

  // Type catalogue is small; aggregate every page once so the picker is
  // exhaustive without a paginated combobox.
  const [types, setTypes] = useState<FerryType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState("");

  const { formError, fieldErrors, reset, setFromApiError } = useFieldErrors();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTypesLoading(true);
      setTypesError("");
      try {
        const collected: FerryType[] = [];
        let page = 1;
        let lastPage = 1;
        do {
          const res = await listFerryTypes(page);
          collected.push(...res.data);
          lastPage = res.meta.last_page;
          page += 1;
        } while (page <= lastPage);
        if (cancelled) return;
        collected.sort((a, b) => a.name.localeCompare(b.name));
        setTypes(collected);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError || error instanceof Error) {
          setTypesError(error.message || "Failed to load ferry types.");
        } else {
          setTypesError("Failed to load ferry types.");
        }
      } finally {
        if (!cancelled) setTypesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty =
    form.name !== snapshot.name ||
    form.ferry_type_id !== snapshot.ferry_type_id;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (): FerryInput => ({
    name: form.name,
    ferry_type_id: Number(form.ferry_type_id),
  });

  const buildDiff = (): Partial<FerryInput> => {
    const diff: Partial<FerryInput> = {};
    if (form.name !== snapshot.name) diff.name = form.name;
    if (form.ferry_type_id !== snapshot.ferry_type_id) {
      diff.ferry_type_id = Number(form.ferry_type_id);
    }
    return diff;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    try {
      if (mode.kind === "create") {
        const res = await createFerry(buildPayload());
        toast.success(`Created ${res.data.name}.`);
        router.push(`/admin/ferries/${res.data.id}`);
      } else {
        const res = await updateFerry(mode.initial.id, buildDiff());
        toast.success(`Updated ${res.data.name}.`);
        router.push(`/admin/ferries/${mode.initial.id}`);
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
      title={isCreate ? "New ferry" : `Edit ${mode.initial.name}`}
      description={
        isCreate
          ? "Add a new vessel under an existing ferry type."
          : "Update this vessel."
      }
      submitLabel={
        submitting
          ? isCreate
            ? "Creating…"
            : "Saving…"
          : isCreate
            ? "Create ferry"
            : "Save changes"
      }
      isDirty={isDirty}
      isSubmitting={submitting}
      formError={formError}
      onSubmit={onSubmit}
      onCancel={() =>
        router.push(
          isCreate ? "/admin/ferries" : `/admin/ferries/${mode.initial.id}`,
        )
      }
    >
      <FormField label="Name" name="name" errors={fieldErrors} required>
        <Input
          type="text"
          required
          maxLength={255}
          placeholder="e.g. Isla Express II"
          value={form.name}
          onChange={(event) => setField("name", event.target.value)}
        />
      </FormField>

      <FormField
        label="Ferry type"
        name="ferry_type_id"
        errors={fieldErrors}
        helper="Vessels inherit price + capacity from the type."
        required
      >
        <Select
          value={form.ferry_type_id}
          onValueChange={(next) => setField("ferry_type_id", next)}
          disabled={typesLoading || types.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                typesLoading ? "Loading types…" : "Select a ferry type"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type.id} value={String(type.id)}>
                {type.name} · cap {type.capacity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {typesError ? (
        <p className="text-sm text-destructive">{typesError}</p>
      ) : null}

      {!typesLoading && types.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No ferry types exist yet — create one before adding vessels.
        </p>
      ) : null}
    </FormPage>
  );
}
