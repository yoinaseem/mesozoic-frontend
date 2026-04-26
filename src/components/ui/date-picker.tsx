"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DayPickerProps, Matcher } from "react-day-picker";

type CaptionLayout = NonNullable<DayPickerProps["captionLayout"]>;

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type DatePickerProps = {
  value: string | null;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabledDates?: string[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  align?: "start" | "center" | "end";
  displayFormat?: string;
  captionLayout?: CaptionLayout;
  yearDropdownWindow?: number;
};

function toDate(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined;
  const parsed = parseISO(iso);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  disabledDates,
  placeholder = "Pick a date",
  disabled,
  id,
  className,
  align = "start",
  displayFormat = "PPP",
  captionLayout = "dropdown-years",
  yearDropdownWindow = 5,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);

  const fallbackEndMonth = React.useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + yearDropdownWindow);
    return d;
  }, [yearDropdownWindow]);
  const effectiveEndMonth = maxDate ?? fallbackEndMonth;

  const disabledDateObjs = React.useMemo<Date[] | undefined>(() => {
    if (!disabledDates || disabledDates.length === 0) return undefined;
    const out: Date[] = [];
    for (const iso of disabledDates) {
      const d = toDate(iso);
      if (d) out.push(d);
    }
    return out.length > 0 ? out : undefined;
  }, [disabledDates]);

  const disabledMatcher = React.useMemo<Matcher[] | undefined>(() => {
    const matchers: Matcher[] = [];
    if (minDate) matchers.push({ before: minDate });
    if (maxDate) matchers.push({ after: maxDate });
    if (disabledDateObjs) matchers.push(disabledDateObjs);
    return matchers.length ? matchers : undefined;
  }, [minDate, maxDate, disabledDateObjs]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={selected ? format(selected, displayFormat) : placeholder}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" aria-hidden />
          {selected ? format(selected, displayFormat) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? minDate}
          startMonth={minDate}
          endMonth={effectiveEndMonth}
          captionLayout={captionLayout}
          disabled={disabledMatcher}
          showOutsideDays={true}
          onSelect={(date) => {
            if (!date) return;
            onChange(toIso(date));
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
