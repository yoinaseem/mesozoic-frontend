import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import type { FieldErrors } from "@/types/auth";

type FormFieldProps = {
  label: ReactNode;
  name: string;
  errors?: FieldErrors;
  required?: boolean;
  helper?: ReactNode;
  className?: string;
  children: ReactElement<{
    id?: string;
    name?: string;
    "aria-invalid"?: boolean | "true" | "false";
    "aria-describedby"?: string;
  }>;
};

export function FormField({
  label,
  name,
  errors,
  required,
  helper,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const child = Children.only(children);
  const hasError = Boolean(errors?.[name]?.length);
  const fieldErrors = errors?.[name] ?? [];
  const errorId = `${name}-error-${generatedId}`;
  const helperId = helper ? `${name}-helper-${generatedId}` : undefined;
  const describedBy = hasError ? errorId : helperId;

  const controlId =
    (isValidElement(child) && child.props.id) || `${name}-${generatedId}`;

  const control = cloneElement(child, {
    id: controlId,
    name: isValidElement(child) && child.props.name ? child.props.name : name,
    "aria-invalid": hasError ? true : undefined,
    "aria-describedby": describedBy,
  });

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={controlId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {control}
      {hasError ? (
        <p id={errorId} className="text-sm text-destructive">
          {fieldErrors.join(" ")}
        </p>
      ) : helper ? (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
