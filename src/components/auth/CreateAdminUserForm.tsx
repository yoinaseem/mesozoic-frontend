"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/admin/FormField";
import { FormPage } from "@/components/admin/FormPage";
import { useFieldErrors } from "@/components/admin/useFieldErrors";
import { Input } from "@/components/ui/input";
import { createUser } from "@/lib/api/users";

export function CreateAdminUserForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { formError, fieldErrors, setFieldErrors, reset, setFromApiError } =
    useFieldErrors();

  const isDirty =
    name.length > 0 ||
    email.length > 0 ||
    password.length > 0 ||
    passwordConfirmation.length > 0;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();

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

      toast.success(`Created ${created.data.name}.`);
      setName("");
      setEmail("");
      setPassword("");
      setPasswordConfirmation("");
      reset();
      router.refresh();
    } catch (error) {
      setFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPage
      title="Create admin user"
      description="Create a staff account. Role assignment happens separately once the backend exposes it."
      submitLabel={submitting ? "Creating user..." : "Create user"}
      isDirty={isDirty}
      isSubmitting={submitting}
      formError={formError}
      onSubmit={onSubmit}
      onCancel={() => router.back()}
    >
      <FormField
        label="Full name"
        name="name"
        errors={fieldErrors}
        required
      >
        <Input
          type="text"
          autoComplete="name"
          required
          placeholder="Ada Lovelace"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>

      <FormField
        label="Work email"
        name="email"
        errors={fieldErrors}
        required
      >
        <Input
          type="email"
          autoComplete="email"
          required
          placeholder="ada@mesozoicisle.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>

      <FormField
        label="Temporary password"
        name="password"
        errors={fieldErrors}
        required
        helper="At least 8 characters. The user can change it after first login."
      >
        <Input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>

      <FormField
        label="Confirm password"
        name="password_confirmation"
        errors={fieldErrors}
        required
      >
        <Input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
        />
      </FormField>
    </FormPage>
  );
}
