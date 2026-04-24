"use client";

import { useAuth } from "@/context/auth-context";
import { hasAnyManagementRole } from "@/config/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLandingPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/login");
    } else if (hasAnyManagementRole(user?.roles)) {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading, user, router]);

  return (
    <div className="bg-base flex min-h-dvh items-center justify-center">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center"
      >
        <span className="sr-only">Redirecting</span>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-(--color-border) border-t-(--color-primary)" />
      </div>
    </div>
  );
}
