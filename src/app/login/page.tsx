import type { Metadata } from "next";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Mesozoic Isle",
  description: "Sign in to your Mesozoic Isle account.",
};

export default function LoginPage() {
  return (
    <AuthPageLayout variant="login">
      <div className="card w-full max-w-md">
        <h1 className="text-3xl font-semibold text-primary">Sign in</h1>
        <LoginForm />
      </div>
    </AuthPageLayout>
  );
}
