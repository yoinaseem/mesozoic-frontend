"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRoundIcon } from "lucide-react";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";
import { listPermissions } from "@/lib/api/permissions";
import type { Permission } from "@/types/auth";

function groupKey(name: string): string {
  const dot = name.indexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}

function groupLabel(prefix: string): string {
  const spaced = prefix.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function actionLabel(name: string): string {
  const dot = name.indexOf(".");
  return dot === -1 ? name : name.slice(dot + 1);
}

export default function PermissionsPage() {
  const [catalogue, setCatalogue] = useState<Permission[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listPermissions()
      .then((res) => {
        if (!cancelled) setCatalogue(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message || "Failed to load permissions.");
        } else {
          setError("Failed to load permissions.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    if (!catalogue) return [];
    const map = new Map<string, Permission[]>();
    for (const perm of catalogue) {
      const key = groupKey(perm.name);
      const list = map.get(key);
      if (list) list.push(perm);
      else map.set(key, [perm]);
    }
    return Array.from(map, ([prefix, items]) => ({
      prefix,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    })).sort((a, b) => a.prefix.localeCompare(b.prefix));
  }, [catalogue]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Permissions" },
        ]}
      />

      <PageHeader
        title="Permissions"
        description="The full permission catalogue. Permissions map to backend code paths and can only be added in a server release. To grant access to existing permissions, edit a role or grant directly to a user."
      />

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      ) : !catalogue ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={KeyRoundIcon}
          title="No permissions"
          description="The backend hasn't seeded any permissions yet."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.prefix}
              className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-semibold">
                  {groupLabel(group.prefix)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {group.items.length}
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {group.items.map((perm) => (
                  <li
                    key={perm.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-mono text-xs">
                      {actionLabel(perm.name)}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {perm.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
