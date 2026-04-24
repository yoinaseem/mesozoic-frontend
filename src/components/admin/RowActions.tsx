"use client";

import { MoreHorizontalIcon, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RowActionItem = {
  label: string;
  icon?: ComponentType<LucideProps>;
  onSelect: () => void;
  variant?: "default" | "destructive";
  permission?: string;
  disabled?: boolean;
};

type RowActionsProps = {
  items: RowActionItem[];
};

export function RowActions({ items }: RowActionsProps) {
  const { hasPermission } = useAuth();
  const visible = items.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  if (visible.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Open row actions">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.label}
              variant={item.variant ?? "default"}
              disabled={item.disabled}
              onSelect={(event) => {
                event.preventDefault();
                item.onSelect();
              }}
            >
              {Icon ? <Icon /> : null}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
