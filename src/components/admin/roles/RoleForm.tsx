"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { FormPage } from "@/components/admin/FormPage";
import { PermissionPicker } from "@/components/admin/PermissionPicker";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listPermissions } from "@/lib/api/permissions";
import { createRole, updateRole, type RoleInput } from "@/lib/api/roles";
import type { Permission, Role } from "@/types/auth";

type RoleFormMode =
  | { kind: "create" }
  | { kind: "edit"; initial: Role };

type RoleFormProps = {
  mode: RoleFormMode;
  // Render slot below the form (used on edit page for the Delete button).
  footer?: React.ReactNode;
};

function arraysEqualUnordered(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  for (const item of b) {
    if (!set.has(item)) return false;
  }
  return true;
}

export function RoleForm({ mode, footer }: RoleFormProps) {
  const router = useRouter();
  const isCreate = mode.kind === "create";
  const isSystem = !isCreate && mode.initial.is_system;

  const snapshot = useMemo(
    () => ({
      name: isCreate ? "" : mode.initial.name,
      permissions: isCreate ? [] : [...mode.initial.permissions].sort(),
    }),
    [isCreate, mode],
  );

  const [name, setName] = useState(snapshot.name);
  const [permissions, setPermissions] = useState<string[]>(snapshot.permissions);
  const [submitting, setSubmitting] = useState(false);

  const [catalogue, setCatalogue] = useState<Permission[] | null>(null);
  const [catalogueError, setCatalogueError] = useState("");

  const { formError, fieldErrors, setFromApiError, reset } = useFieldErrors();

  useEffect(() => {
    let cancelled = false;
    listPermissions()
      .then((res) => {
        if (!cancelled) setCatalogue(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setCatalogueError(
          err instanceof Error
            ? err.message
            : "Failed to load permissions catalogue.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty =
    name !== snapshot.name ||
    !arraysEqualUnordered(permissions, snapshot.permissions);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setSubmitting(true);

    try {
      if (isCreate) {
        const payload: RoleInput = { name, permissions };
        const res = await createRole(payload);
        toast.success(`Created role "${res.data.name}".`);
        router.push("/admin/roles");
      } else {
        const diff: RoleInput = {};
        if (name !== snapshot.name) diff.name = name;
        if (!arraysEqualUnordered(permissions, snapshot.permissions)) {
          diff.permissions = permissions;
        }
        const res = await updateRole(mode.initial.id, diff);
        toast.success(`Updated role "${res.data.name}".`);
        router.push("/admin/roles");
      }
    } catch (error) {
      setFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPage
      title={isCreate ? "New role" : `Edit ${mode.initial.name}`}
      description={
        isCreate
          ? "Bundle a set of permissions that can be assigned to users."
          : isSystem
            ? "System roles are protected — name is locked, but permissions can still be edited."
            : "Edit this role's name and permissions."
      }
      submitLabel={
        submitting
          ? isCreate
            ? "Creating…"
            : "Saving…"
          : isCreate
            ? "Create role"
            : "Save changes"
      }
      isDirty={isDirty}
      isSubmitting={submitting}
      formError={formError}
      onSubmit={onSubmit}
      onCancel={() => router.push("/admin/roles")}
      formClassName="max-w-none"
    >
      <FormField
        label="Name"
        name="name"
        errors={fieldErrors}
        required={isCreate}
        helper={
          isSystem
            ? "System role names cannot be changed."
            : "Lowercase letters, digits, and dashes. Must start with a letter."
        }
      >
        <Input
          type="text"
          required={isCreate}
          placeholder="reports-viewer"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSystem || submitting}
          maxLength={125}
        />
      </FormField>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Permissions</span>
          <span className="text-xs text-muted-foreground">
            {permissions.length} selected
          </span>
        </div>
        {catalogueError ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {catalogueError}
          </p>
        ) : !catalogue ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <PermissionPicker
            catalogue={catalogue}
            value={permissions}
            onChange={setPermissions}
            disabled={submitting}
          />
        )}
        {fieldErrors.permissions ? (
          <p className="text-sm text-destructive">
            {fieldErrors.permissions[0]}
          </p>
        ) : null}
      </div>

      {footer ? <div className="border-t pt-4">{footer}</div> : null}
    </FormPage>
  );
}
