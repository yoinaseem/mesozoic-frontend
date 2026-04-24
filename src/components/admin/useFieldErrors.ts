"use client";

import { useCallback, useState } from "react";

import { ApiError, getValidationErrors, toastApiError } from "@/lib/api-client";
import type { FieldErrors } from "@/types/auth";

export function useFieldErrors() {
  const [formError, setFormError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const reset = useCallback(() => {
    setFormError("");
    setFieldErrors({});
  }, []);

  const setFromApiError = useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 422) {
        setFieldErrors(getValidationErrors(error));
        setFormError("");
        return;
      }
      setFieldErrors({});
      if (error.status === 401 || error.status === 403 || error.status === 429) {
        setFormError("");
        toastApiError(error);
        return;
      }
    } else {
      setFieldErrors({});
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Something went wrong. Please try again.";
    setFormError(message);
    toastApiError(error);
  }, []);

  return {
    formError,
    fieldErrors,
    setFormError,
    setFieldErrors,
    reset,
    setFromApiError,
  };
}
