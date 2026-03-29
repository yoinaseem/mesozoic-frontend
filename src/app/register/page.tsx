import type { Metadata } from "next";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create account | Mesozoic Isle",
  description: "Create a Mesozoic Isle account to book adventures and manage your visits.",
};

export default function RegisterPage() {
  return (
    <AuthPageLayout variant="register">
      <div className="card w-full max-w-md self-start">
        <h1 className="text-3xl font-bold text-primary">Create account</h1>
        <p className="mt-2 text-muted">
          Join Mesozoic Isle to book tours, save your preferences, and plan your island visit.
        </p>

        <RegisterForm />
      </div>
    </AuthPageLayout>
  );
}
