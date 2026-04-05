"use client";

import { useAuth } from "@/context/auth-context";
import { ApiError, getValidationErrors } from "@/lib/api-client";
import type { FieldErrors } from "@/types/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const inputClass =
  "mt-1 w-full rounded-lg border border-base bg-base px-3 py-2.5 text-base text-base-color placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";
const inputErrorClass =
  "mt-1 w-full rounded-lg border border-[var(--color-danger)] bg-base px-3 py-2.5 text-base text-base-color placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

export function RegisterForm() {
  const { register, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, loading, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");

    if (password !== passwordConfirmation) {
      setFieldErrors({
        password_confirmation: ["Passwords do not match."],
      });
      return;
    }

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      router.replace("/");
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const validationErrors = getValidationErrors(error);
        setFieldErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
          setFormError("Please review your details and try again.");
        }

        return;
      }

      if (error instanceof Error && error.message.trim()) {
        setFormError(error.message);
        return;
      }

      setFormError("Unable to create your account right now. Please try again.");
    }
  };

  return (
    <>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="register-name" className="block text-sm font-medium text-base-color">
            Full name
          </label>
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Ada Lovelace"
            className={fieldErrors.name?.length ? inputErrorClass : inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {fieldErrors.name?.map((error) => (
            <p className="mt-1 text-sm text-danger" key={error}>
              {error}
            </p>
          ))}
        </div>

        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-base-color">
            Email
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className={fieldErrors.email?.length ? inputErrorClass : inputClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {fieldErrors.email?.map((error) => (
            <p className="mt-1 text-sm text-danger" key={error}>
              {error}
            </p>
          ))}
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-medium text-base-color">
            Password
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={fieldErrors.password?.length ? inputErrorClass : inputClass}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {fieldErrors.password?.map((error) => (
            <p className="mt-1 text-sm text-danger" key={error}>
              {error}
            </p>
          ))}
          <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
        </div>

        <div>
          <label
            htmlFor="register-password-confirm"
            className="block text-sm font-medium text-base-color"
          >
            Confirm password
          </label>
          <input
            id="register-password-confirm"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={fieldErrors.password_confirmation?.length ? inputErrorClass : inputClass}
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
          />
          {fieldErrors.password_confirmation?.map((error) => (
            <p className="mt-1 text-sm text-danger" key={error}>
              {error}
            </p>
          ))}
        </div>

        {formError ? <p className="mt-2 text-sm text-danger">{formError}</p> : null}

        <button type="submit" className="btn-primary mt-2 w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary">
          Sign in
        </Link>
      </p>
    </>
  );
}
