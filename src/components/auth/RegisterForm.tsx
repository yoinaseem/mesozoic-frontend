"use client";

import Link from "next/link";

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
            className="mt-1 w-full rounded-lg border border-base bg-base px-3 py-2.5 text-base text-base-color placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
            className="mt-1 w-full rounded-lg border border-base bg-base px-3 py-2.5 text-base text-base-color placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
            className="mt-1 w-full rounded-lg border border-base bg-base px-3 py-2.5 text-base text-base-color placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
            className="mt-1 w-full rounded-lg border border-base bg-base px-3 py-2.5 text-base text-base-color placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
