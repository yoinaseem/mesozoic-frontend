"use client";

import type { FormEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import { PageHeader } from "./PageHeader";

type FormPageProps = {
  title: string;
  description?: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isDirty?: boolean;
  isSubmitting?: boolean;
  formError?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  headerActions?: ReactNode;
  formClassName?: string;
  children: ReactNode;
};

export function FormPage({
  title,
  description,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isDirty = true,
  isSubmitting = false,
  formError,
  onSubmit,
  onCancel,
  headerActions,
  formClassName,
  children,
}: FormPageProps) {
  const saveDisabled = isSubmitting || !isDirty;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PageHeader
        title={title}
        description={description}
        actions={headerActions}
      />
      <form
        onSubmit={onSubmit}
        className={cn("flex flex-1 flex-col gap-4", formClassName)}
      >
        <div className="max-w-xl space-y-4">{children}</div>

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-2 border-t bg-background/80 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button type="submit" disabled={saveDisabled}>
            {isSubmitting ? <Spinner /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
