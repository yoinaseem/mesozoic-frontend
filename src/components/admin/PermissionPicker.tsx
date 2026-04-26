"use client";

import { useId, useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Permission } from "@/types/auth";

type PermissionPickerProps = {
  catalogue: Permission[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
  emptyHint?: string;
};

function groupKey(name: string): string {
  const dot = name.indexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}

function groupLabel(prefix: string): string {
  // "room-types" -> "Room types", "hotels" -> "Hotels", etc.
  const spaced = prefix.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function actionLabel(name: string): string {
  // "hotels.update" -> "update"
  const dot = name.indexOf(".");
  return dot === -1 ? name : name.slice(dot + 1);
}

type Group = { prefix: string; items: Permission[] };

export function PermissionPicker({
  catalogue,
  value,
  onChange,
  disabled,
  className,
  emptyHint = "No permissions match your search.",
}: PermissionPickerProps) {
  const [query, setQuery] = useState("");
  const searchId = useId();

  const selected = useMemo(() => new Set(value), [value]);

  const filteredGroups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase();
    const groups = new Map<string, Permission[]>();
    for (const perm of catalogue) {
      if (q && !perm.name.toLowerCase().includes(q)) continue;
      const key = groupKey(perm.name);
      const list = groups.get(key);
      if (list) list.push(perm);
      else groups.set(key, [perm]);
    }
    return Array.from(groups, ([prefix, items]) => ({
      prefix,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    })).sort((a, b) => a.prefix.localeCompare(b.prefix));
  }, [catalogue, query]);

  const togglePermission = (name: string, checked: boolean) => {
    if (disabled) return;
    if (checked) {
      if (selected.has(name)) return;
      onChange([...value, name]);
    } else {
      if (!selected.has(name)) return;
      onChange(value.filter((n) => n !== name));
    }
  };

  const toggleGroup = (group: Group, checked: boolean) => {
    if (disabled) return;
    const groupNames = group.items.map((p) => p.name);
    if (checked) {
      const next = new Set(value);
      for (const n of groupNames) next.add(n);
      onChange(Array.from(next));
    } else {
      const drop = new Set(groupNames);
      onChange(value.filter((n) => !drop.has(n)));
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="space-y-1">
        <label
          htmlFor={searchId}
          className="block text-xs font-medium text-muted-foreground"
        >
          Filter
        </label>
        <Input
          id={searchId}
          type="search"
          placeholder="Search permissions"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8"
          disabled={disabled}
        />
      </div>

      {filteredGroups.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          {emptyHint}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => {
            const groupSelected = group.items.filter((p) =>
              selected.has(p.name),
            ).length;
            const allOn = groupSelected === group.items.length;
            const someOn = groupSelected > 0 && !allOn;
            return (
              <div
                key={group.prefix}
                className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3"
              >
                <label
                  className={cn(
                    "flex items-center justify-between gap-2 border-b pb-2",
                    disabled && "opacity-60",
                  )}
                >
                  <span className="text-sm font-semibold">
                    {groupLabel(group.prefix)}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {groupSelected}/{group.items.length}
                    <Checkbox
                      checked={allOn ? true : someOn ? "indeterminate" : false}
                      onCheckedChange={(c) => toggleGroup(group, c === true)}
                      disabled={disabled}
                      aria-label={`Select all ${groupLabel(group.prefix)} permissions`}
                    />
                  </span>
                </label>
                <ul className="flex flex-col gap-1.5">
                  {group.items.map((perm) => {
                    const isOn = selected.has(perm.name);
                    return (
                      <li key={perm.id}>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={isOn}
                            onCheckedChange={(c) =>
                              togglePermission(perm.name, c === true)
                            }
                            disabled={disabled}
                          />
                          <span className="font-mono text-xs">
                            {actionLabel(perm.name)}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
