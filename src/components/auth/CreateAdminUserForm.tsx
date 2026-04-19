"use client";

import { ApiError, getValidationErrors } from "@/lib/api-client";
import { createUser } from "@/lib/api/users";
import type { FieldErrors } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function CreateAdminUserForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    setSuccessMessage("");

    if (password !== passwordConfirmation) {
      setFieldErrors({
        password_confirmation: ["Passwords do not match."],
      });
      return;
    }

    setSubmitting(true);

    try {
      const created = await createUser({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccessMessage(
        `Created ${created.name}. Assign their role from the users list — new accounts start with no role.`,
      );
      setName("");
      setEmail("");
      setPassword("");
      setPasswordConfirmation("");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setFieldErrors(getValidationErrors(error));
        return;
      }

      if (error instanceof ApiError && error.status === 403) {
        setFormError("Only a superadmin can create users.");
        return;
      }

      if (error instanceof Error && error.message.trim()) {
        setFormError(error.message);
        return;
      }

      setFormError("Unable to create the user right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-8 space-y-4" onSubmit={onSubmit}>
      <div>
        <label htmlFor="admin-user-name" className="block text-sm font-medium">
          Full name
        </label>
        <Input
          id="admin-user-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Ada Lovelace"
          aria-invalid={fieldErrors.name?.length ? true : undefined}
          className="mt-1"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {fieldErrors.name?.map((error) => (
          <p className="mt-1 text-sm text-destructive" key={error}>
            {error}
          </p>
        ))}
      </div>

      <div>
        <label htmlFor="admin-user-email" className="block text-sm font-medium">
          Work email
        </label>
        <Input
          id="admin-user-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="ada@mesozoicisle.com"
          aria-invalid={fieldErrors.email?.length ? true : undefined}
          className="mt-1"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {fieldErrors.email?.map((error) => (
          <p className="mt-1 text-sm text-destructive" key={error}>
            {error}
          </p>
        ))}
      </div>

      <div>
        <label htmlFor="admin-user-password" className="block text-sm font-medium">
          Temporary password
        </label>
        <Input
          id="admin-user-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={fieldErrors.password?.length ? true : undefined}
          className="mt-1"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {fieldErrors.password?.map((error) => (
          <p className="mt-1 text-sm text-destructive" key={error}>
            {error}
          </p>
        ))}
        <p className="mt-1 text-xs text-muted-foreground">
          At least 8 characters. The user can change it after first login.
        </p>
      </div>

      <div>
        <label
          htmlFor="admin-user-password-confirm"
          className="block text-sm font-medium"
        >
          Confirm password
        </label>
        <Input
          id="admin-user-password-confirm"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={fieldErrors.password_confirmation?.length ? true : undefined}
          className="mt-1"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
        />
        {fieldErrors.password_confirmation?.map((error) => (
          <p className="mt-1 text-sm text-destructive" key={error}>
            {error}
          </p>
        ))}
      </div>

      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}

      {successMessage ? (
        <p className="text-sm text-primary">{successMessage}</p>
      ) : null}

      <Button type="submit" disabled={submitting} className="mt-2 w-full">
        {submitting ? "Creating user..." : "Create user"}
      </Button>
    </form>
  );
}
