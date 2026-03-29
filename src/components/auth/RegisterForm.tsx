"use client";

import Link from "next/link";
import { authFieldClass } from "@/components/auth/auth-fields";

export function RegisterForm() {
  return (
    <>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
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
            className={`mt-1 ${authFieldClass}`}
          />
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
            className={`mt-1 ${authFieldClass}`}
          />
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
            className={`mt-1 ${authFieldClass}`}
          />
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
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={`mt-1 ${authFieldClass}`}
          />
        </div>

        <button type="submit" className="btn-primary mt-2 w-full">
          Create account
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
