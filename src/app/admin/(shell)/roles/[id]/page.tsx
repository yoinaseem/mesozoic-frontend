"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { RoleForm } from "@/components/admin/roles/RoleForm";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, toastApiError } from "@/lib/api-client";
import { deleteRole, getRole } from "@/lib/api/roles";
import type { Role } from "@/types/auth";

export default function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const roleId = Number(id);
  const invalid = Number.isNaN(roleId);

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(!invalid);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (invalid) return;
    let cancelled = false;
    getRole(roleId)
      .then((res) => {
        if (cancelled) return;
        setRole(res.data);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message || "Failed to load role.");
        } else {
          setError("Failed to load role.");
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roleId, invalid]);

  const onDelete = async () => {
    if (!role) return;
    setDeleting(true);
    try {
      await deleteRole(role.id);
      toast.success(`Deleted role "${role.name}".`);
      router.push("/admin/roles");
    } catch (err) {
      toastApiError(err);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  if (invalid) {
    return (
      <p className="py-20 text-center text-sm text-destructive">
        Invalid role id.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-20 text-center text-sm text-destructive">{error}</p>
    );
  }

  if (!role) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Role not found.
      </p>
    );
  }

  const usersCount = role.users_count ?? 0;
  const inUse = usersCount > 0;
  const canDelete = !role.is_system;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Roles", href: "/admin/roles" },
          { label: role.name },
        ]}
      />

      <RoleForm
        mode={{ kind: "edit", initial: role }}
        footer={
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {usersCount === 0
                ? "No users currently hold this role."
                : `Held by ${usersCount} user${usersCount === 1 ? "" : "s"}.`}
            </p>
            {canDelete ? (
              <div className="flex flex-col items-start gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={inUse || deleting}
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2Icon />
                  Delete role
                </Button>
                {inUse ? (
                  <p className="text-xs text-muted-foreground">
                    Reassign the {usersCount} user{usersCount === 1 ? "" : "s"} holding this role
                    before deleting.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                System roles cannot be deleted.
              </p>
            )}
          </div>
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete role "${role.name}"?`}
        description="This permanently removes the role. Permissions granted to users via other roles or direct grants are unaffected."
        confirmLabel="Delete role"
        onConfirm={onDelete}
      />
    </div>
  );
}
