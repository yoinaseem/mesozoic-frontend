"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
  loginPath?: string;
  unauthorizedPath?: string;
};

export function ProtectedRoute({
  children,
  allowedRoles,
  loginPath = "/login",
  unauthorizedPath = "/dashboard",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const hasRequiredRole =
    !allowedRoles || (user?.roles?.some((role) => allowedRoles.includes(role)) ?? false);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(loginPath);
      return;
    }

    if (!hasRequiredRole) {
      router.replace(unauthorizedPath);
    }
  }, [isAuthenticated, loading, hasRequiredRole, router, loginPath, unauthorizedPath]);

  if (loading) {
    return (
      <div className="bg-base flex min-h-screen items-center justify-center">
        <div role="status" aria-live="polite" className="flex items-center justify-center">
          <span className="sr-only">Loading protected content</span>
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-(--color-border) border-t-(--color-primary)" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
}
