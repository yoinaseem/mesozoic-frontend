"use client";

import * as React from "react";
import { ClockIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type TimePickerProps = {
  value: string | null;
  onChange: (value: string) => void;
  /** Minute granularity. Defaults to 5. */
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  align?: "start" | "center" | "end";
};

// Accepts "HH:mm" or "HH:mm:ss" (API shape). Emits "HH:mm" — callers at the
// API boundary can pad ":00" if needed.
function parseTime(value: string | null): { hour: number; minute: number } | null {
  if (!value) return null;
  const parts = value.split(":");
  if (parts.length < 2) return null;
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function formatDisplay(time: { hour: number; minute: number }): string {
  return `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
}

function buildMinuteList(step: number, currentMinute: number | null): number[] {
  const minutes: number[] = [];
  for (let m = 0; m < 60; m += step) minutes.push(m);
  // If the current minute falls between steps, keep it selectable.
  if (currentMinute != null && !minutes.includes(currentMinute)) {
    minutes.push(currentMinute);
    minutes.sort((a, b) => a - b);
  }
  return minutes;
}

export function TimePicker({
  value,
  onChange,
  step = 5,
  placeholder = "Pick a time",
  disabled,
  id,
  className,
  align = "start",
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parsed = parseTime(value);
  const minutes = React.useMemo(
    () => buildMinuteList(step, parsed?.minute ?? null),
    [step, parsed?.minute],
  );

  const commit = (hour: number, minute: number) => {
    onChange(formatDisplay({ hour, minute }));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={parsed ? formatDisplay(parsed) : placeholder}
          className={cn(
            "w-full justify-start text-left font-normal",
            !parsed && "text-muted-foreground",
            className,
          )}
        >
          <ClockIcon className="mr-2 size-4" aria-hidden />
          {parsed ? formatDisplay(parsed) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div
          className="flex h-64"
          role="group"
          aria-label="Select time"
        >
          <TimeColumn
            label="Hour"
            values={Array.from({ length: 24 }, (_, i) => i)}
            selected={parsed?.hour ?? null}
            onSelect={(next) => commit(next, parsed?.minute ?? 0)}
          />
          <div className="w-px bg-border" aria-hidden />
          <TimeColumn
            label="Minute"
            values={minutes}
            selected={parsed?.minute ?? null}
            onSelect={(next) => {
              commit(parsed?.hour ?? 0, next);
              setOpen(false);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

type TimeColumnProps = {
  label: string;
  values: number[];
  selected: number | null;
  onSelect: (value: number) => void;
};

function TimeColumn({ label, values, selected, onSelect }: TimeColumnProps) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const selectedRef = React.useRef<HTMLButtonElement | null>(null);

  // Scroll the selected item into view when the popover opens.
  React.useEffect(() => {
    if (selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selected]);

  return (
    <div className="flex w-20 flex-col">
      <div className="border-b px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-1"
        role="listbox"
        aria-label={label}
      >
        {values.map((v) => {
          const isSelected = v === selected;
          return (
            <button
              key={v}
              ref={isSelected ? selectedRef : null}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(v)}
              className={cn(
                "flex w-full items-center justify-center rounded-sm px-2 py-1 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {String(v).padStart(2, "0")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
