"use client";

import { useAuth } from "@/context/auth-context";
import { ApiError, getValidationErrors } from "@/lib/api-client";
import type { FieldErrors } from "@/types/auth";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

const DEFAULT_AFTER_AUTH = "/dashboard";

function resolveNextPath(nextParam: string | null): string {
  if (!nextParam || nextParam === "/") {
    return DEFAULT_AFTER_AUTH;
  }

  if (!nextParam.startsWith("/") || nextParam.startsWith("//")) {
    return DEFAULT_AFTER_AUTH;
  }

  return nextParam;
}

export function LoginForm() {
  const { login, isAuthenticated, loading } = useAuth();
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

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, loading, nextPath, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");

    try {
      await login({ email, password });
      router.replace(nextPath);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const validationErrors = getValidationErrors(error);
        setFieldErrors(validationErrors);

        if (
          !validationErrors.email?.length &&
          !validationErrors.password?.length
        ) {
          setFormError("Please review the highlighted fields and try again.");
        }

        return;
      }

      if (error instanceof Error && error.message.trim()) {
        setFormError(error.message);
        return;
      }

      setFormError("Unable to sign in right now. Please try again.");
    }
  };

  return (
    <>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-base-color"
          >
            Email
          </label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
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
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-base-color"
            >
              Password
            </label>
            <span className="text-xs text-muted">Forgot password?</span>
          </div>
          <Input
            id="login-password"
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

        {formError ? (
          <p className="mt-2 text-sm text-danger">{formError}</p>
        ) : null}

        <button
          type="submit"
          className="btn-primary mt-2 w-full"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-primary">
          Create one
        </Link>
      </p>
    </>
  );
}
