"use client";

import { useAuth } from "@/context/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const hasRequiredRole =
    !allowedRoles || (user?.roles.some((role) => allowedRoles.includes(role)) ?? false);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      const redirectTarget = pathname
        ? `/login?next=${encodeURIComponent(pathname)}`
        : "/login";
      router.replace(redirectTarget);
      return;
    }

    if (!hasRequiredRole) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading, hasRequiredRole, pathname, router]);

  if (loading) {
    return (
      <div className="bg-base flex min-h-screen items-center justify-center">
        <div role="status" aria-live="polite" className="flex items-center justify-center">
          <span className="sr-only">Loading protected content</span>
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
}
