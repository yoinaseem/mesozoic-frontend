"use client";

import { useAuth } from "@/context/auth-context";
import { hasAnyManagementRole } from "@/config/roles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function CustomerDashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();

  if (loading || !isAuthenticated || !user) return null;
  if (hasAnyManagementRole(user.roles)) return null;

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  return (
    <section className="bg-base py-16" aria-label="Your account">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Signed in
            </p>
            <h2 className="mt-2 text-3xl font-bold text-primary">
              Welcome back, {user.name}
            </h2>
            <p className="text-muted mt-1 text-sm">
              Here&apos;s a look at your Mesozoic Isle activity.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={loading}>
            {loading ? "Signing out…" : "Sign out"}
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming bookings</CardTitle>
              <CardDescription>
                Ferries, stays, and activities you have coming up.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Nothing scheduled yet. Book an adventure to see it here.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking history</CardTitle>
              <CardDescription>Past visits and receipts.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              You don&apos;t have any past bookings on file.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Keep your contact details current.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Name:</span> {user.name}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {user.email}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
