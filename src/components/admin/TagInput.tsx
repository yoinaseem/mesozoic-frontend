"use client";

import { useState, type KeyboardEvent } from "react";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TagInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  "aria-invalid"?: boolean | "true" | "false";
  className?: string;
};

export function TagInput({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  name,
  "aria-invalid": ariaInvalid,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  };

  const removeAt = (index: number) => {
    const next = value.slice();
    next.splice(index, 1);
    onChange(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === "Backspace" && draft.length === 0 && value.length > 0) {
      event.preventDefault();
      removeAt(value.length - 1);
    }
  };

  return (
    <div
      data-slot="tag-input"
      data-disabled={disabled || undefined}
      aria-invalid={ariaInvalid}
      className={cn(
        "flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-1.5 py-1 text-sm transition-colors",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:bg-input/30",
        className,
      )}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button")) return;
        event.currentTarget.querySelector("input")?.focus();
      }}
    >
      {value.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground"
        >
          {tag}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="-mr-1 size-4 opacity-60 hover:opacity-100"
            onClick={() => removeAt(index)}
            disabled={disabled}
            aria-label={`Remove ${tag}`}
          >
            <XIcon />
          </Button>
        </span>
      ))}
      <input
        id={id}
        name={name}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : undefined}
        disabled={disabled}
        className="min-w-[6rem] flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}
