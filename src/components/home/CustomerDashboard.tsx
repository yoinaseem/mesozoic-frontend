"use client";

import {
  CalendarCheck,
  Compass,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ContactStaffNote } from "@/components/dashboard/ContactStaffNote";
import { InProgressBookingCard } from "@/components/dashboard/InProgressBookingCard";
import { StatTile } from "@/components/dashboard/StatTile";
import { TripList } from "@/components/dashboard/TripList";
import { UpcomingBookingsList } from "@/components/dashboard/UpcomingBookingsList";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  deriveDashboardAggregates,
  deriveUpcomingBookings,
  fetchCustomerSnapshot,
  type CustomerSnapshot,
} from "@/lib/customer-dashboard";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="border-base bg-surface h-28 animate-pulse rounded-xl border"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border-base bg-surface h-72 animate-pulse rounded-xl border" />
        <div className="border-base bg-surface h-72 animate-pulse rounded-xl border" />
      </div>
      <div className="border-base bg-surface h-64 animate-pulse rounded-xl border" />
    </div>
  );
}

export function CustomerDashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [snapshot, setSnapshot] = useState<CustomerSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // "snapshot has settled (data or error)" sentinel — derive loading from
  // it instead of imperatively flipping a boolean inside the effect (which
  // the project's react-hooks/set-state-in-effect lint rule rejects).
  const [snapshotSettled, setSnapshotSettled] = useState(false);
  const snapshotLoading = isAuthenticated && !snapshotSettled;

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetchCustomerSnapshot()
      .then((s) => {
        if (cancelled) return;
        setSnapshot(s);
        setSnapshotSettled(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : "Could not load your dashboard.",
        );
        setSnapshotSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated || !user) return null;

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  const aggregates = snapshot ? deriveDashboardAggregates(snapshot) : null;
  const upcoming = snapshot ? deriveUpcomingBookings(snapshot) : [];

  return (
    <section className="bg-base min-h-screen pt-24 pb-16" aria-label="Your account">
      <div className="mx-auto max-w-7xl px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-muted text-xs font-semibold uppercase tracking-wider">
              Signed in
            </p>
            <h2 className="text-primary mt-2 text-3xl font-bold">
              Welcome back, {user.name}
            </h2>
            <p className="text-muted mt-1 text-sm">
              Here&rsquo;s a look at your Mesozoic Isle activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/book">Book a new trip</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={authLoading}
            >
              {authLoading ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </header>

        <div className="mt-8">
          {snapshotLoading ? (
            <DashboardSkeleton />
          ) : loadError ? (
            <div className="border-danger/40 bg-danger/5 rounded-xl border p-6 text-center">
              <p className="text-danger font-semibold">{loadError}</p>
              <p className="text-muted mt-2 text-sm">
                Refresh the page to try again.
              </p>
            </div>
          ) : snapshot && aggregates ? (
            <div className="space-y-6">
              <InProgressBookingCard />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                  label="Upcoming trips"
                  value={String(aggregates.upcomingTripsCount)}
                  hint="Future check-in dates"
                  icon={Sparkles}
                  accent="primary"
                />
                <StatTile
                  label="Active reservations"
                  value={String(aggregates.activeReservationsCount)}
                  hint="Open trips on the books"
                  icon={Compass}
                />
                <StatTile
                  label="Lifetime trips"
                  value={String(aggregates.lifetimeTripsCount)}
                  hint="Excluding fully cancelled"
                  icon={CalendarCheck}
                />
                <StatTile
                  label="Lifetime spend"
                  value={formatMoney(aggregates.lifetimeSpend)}
                  hint="Estimated, all confirmed bookings"
                  icon={Wallet}
                  accent="primary"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <TripList snapshot={snapshot} />
                <UpcomingBookingsList items={upcoming} />
              </div>

              <ContactStaffNote />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
