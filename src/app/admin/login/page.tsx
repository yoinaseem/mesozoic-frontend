import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  description: "Sign in to the Mesozoic Isle management console.",
};

export default function AdminLoginPage() {
  return (
    <AuthPageLayout variant="login">
      <div className="card w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Mesozoic Isle · Management
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-primary">Admin sign in</h1>
        <Suspense>
          <AdminLoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted">
          Guest?{" "}
          <Link href="/login" className="font-medium text-primary">
            Go to the main site
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
