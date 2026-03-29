"use client";

import Link from "next/link";
import { authFieldClass } from "@/components/auth/auth-fields";

export function LoginForm() {
  return (
    <>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-base-color">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className={`mt-1 ${authFieldClass}`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="login-password" className="block text-sm font-medium text-base-color">
              Password
            </label>
            <span className="text-xs text-muted">Forgot password?</span>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={`mt-1 ${authFieldClass}`}
          />
        </div>

        <button type="submit" className="btn-primary mt-2 w-full">
          Sign in
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
