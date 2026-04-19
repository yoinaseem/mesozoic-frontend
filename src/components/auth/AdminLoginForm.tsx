"use client";

import { useAuth } from "@/context/auth-context";
import { ApiError, getValidationErrors } from "@/lib/api-client";
import { hasAnyManagementRole } from "@/config/roles";
import type { FieldErrors } from "@/types/auth";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

const DEFAULT_AFTER_LOGIN = "/admin/dashboard";

function resolveNextPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith("/admin") || nextParam.startsWith("//")) {
    return DEFAULT_AFTER_LOGIN;
  }
  return nextParam;
}

export function AdminLoginForm() {
  const { login, logout, user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(
    () => resolveNextPath(searchParams.get("next")),
    [searchParams],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || submitting) return;
    if (isAuthenticated && hasAnyManagementRole(user?.roles)) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, loading, submitting, user, nextPath, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    setSubmitting(true);

    try {
      const nextUser = await login({ email, password });

      if (!hasAnyManagementRole(nextUser.roles)) {
        await logout();
        setFormError("This account isn't authorized for the admin panel.");
        return;
      }

      router.replace(nextPath);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const validationErrors = getValidationErrors(error);
        setFieldErrors(validationErrors);
        if (!validationErrors.email?.length && !validationErrors.password?.length) {
          setFormError("Please review the highlighted fields and try again.");
        }
        return;
      }

      if (error instanceof Error && error.message.trim()) {
        setFormError(error.message);
        return;
      }

      setFormError("Unable to sign in right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;

  return (
    <form className="mt-8 space-y-4" onSubmit={onSubmit}>
      <div>
        <label htmlFor="admin-login-email" className="block text-sm font-medium text-base-color">
          Work email
        </label>
        <Input
          id="admin-login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@mesozoicisle.com"
          aria-invalid={fieldErrors.email?.length ? true : undefined}
          className="mt-2"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {fieldErrors.email?.map((error) => (
          <p className="mt-2 text-sm text-danger" key={error}>
            {error}
          </p>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="admin-login-password" className="block text-sm font-medium text-base-color">
            Password
          </label>
          <span className="text-xs text-muted">Contact a superadmin to reset</span>
        </div>
        <Input
          id="admin-login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={fieldErrors.password?.length ? true : undefined}
          className="mt-2"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {fieldErrors.password?.map((error) => (
          <p className="mt-2 text-sm text-danger" key={error}>
            {error}
          </p>
        ))}
      </div>

      {formError ? <p className="mt-2 text-sm text-danger">{formError}</p> : null}

      <button type="submit" className="btn-primary mt-2 w-full" disabled={busy}>
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
