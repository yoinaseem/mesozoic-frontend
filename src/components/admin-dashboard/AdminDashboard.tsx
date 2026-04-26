"use client";

import {
  Activity,
  Bed,
  Sailboat,
  TicketCheck,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { BeachManagerView } from "@/components/admin-dashboard/BeachManagerView";
import { FerryManagerView } from "@/components/admin-dashboard/FerryManagerView";
import { HotelManagerView } from "@/components/admin-dashboard/HotelManagerView";
import { ParkManagerView } from "@/components/admin-dashboard/ParkManagerView";
import { SuperadminOverview } from "@/components/admin-dashboard/SuperadminOverview";
import { useAuth } from "@/context/auth-context";
import {
  adminRoleOf,
  fetchAdminSnapshot,
  type AdminRole,
  type AdminSnapshot,
} from "@/lib/admin-dashboard";

type Tab =
  | "overview"
  | "hotels"
  | "parks"
  | "beach"
  | "ferries";

type TabDef = {
  key: Tab;
  label: string;
  icon: LucideIcon;
};

const SUPERADMIN_TABS: TabDef[] = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "hotels", label: "Hotels", icon: Bed },
  { key: "parks", label: "Parks", icon: TicketCheck },
  { key: "beach", label: "Beach", icon: Waves },
  { key: "ferries", label: "Ferries", icon: Sailboat },
];

// Maps each manager role to the single tab they're allowed to see.
const MANAGER_TAB: Record<Exclude<AdminRole, "superadmin">, Tab> = {
  "hotel-manager": "hotels",
  "park-manager": "parks",
  "beach-manager": "beach",
  "ferry-manager": "ferries",
};

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

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: Tab;
  onChange: (next: Tab) => void;
}) {
  return (
    <nav
      role="tablist"
      aria-label="Dashboard sections"
      className="border-base bg-surface flex flex-wrap gap-1 rounded-lg border p-1"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-primary text-white"
                : "text-base-color hover:bg-base/40"
            }`}
          >
            <Icon className="size-4" aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function ViewForTab({
  tab,
  snapshot,
}: {
  tab: Tab;
  snapshot: AdminSnapshot;
}) {
  switch (tab) {
    case "overview":
      return <SuperadminOverview snapshot={snapshot} />;
    case "hotels":
      return <HotelManagerView snapshot={snapshot} />;
    case "parks":
      return <ParkManagerView snapshot={snapshot} />;
    case "beach":
      return <BeachManagerView snapshot={snapshot} />;
    case "ferries":
      return <FerryManagerView snapshot={snapshot} />;
  }
}

export function AdminDashboard() {
  const { user, loading } = useAuth();
  const role = adminRoleOf(user);

  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [snapshotSettled, setSnapshotSettled] = useState(false);
  const snapshotLoading = role !== null && !snapshotSettled;

  // Default tab: superadmin lands on overview, managers on their lane.
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (!role) return "overview";
    if (role === "superadmin") return "overview";
    return MANAGER_TAB[role];
  });

  useEffect(() => {
    if (!role) return;
    let cancelled = false;
    fetchAdminSnapshot(role)
      .then((s) => {
        if (cancelled) return;
        setSnapshot(s);
        setSnapshotSettled(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Could not load dashboard.",
        );
        setSnapshotSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  if (loading) return <DashboardSkeleton />;

  if (!role) {
    return (
      <div className="border-base bg-surface rounded-xl border p-6 text-center text-sm">
        <p className="text-muted">
          Your account doesn&rsquo;t hold any admin role. Ask a superadmin to
          assign you a role to see this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-primary text-2xl font-bold">Admin dashboard</h1>
          <p className="text-muted text-sm">
            {role === "superadmin"
              ? "Operations overview across every channel."
              : `Operations view for the ${role.replace("-", " ")} role.`}
          </p>
        </div>
      </header>

      {role === "superadmin" ? (
        <TabBar
          tabs={SUPERADMIN_TABS}
          active={activeTab}
          onChange={setActiveTab}
        />
      ) : null}

      {snapshotLoading ? (
        <DashboardSkeleton />
      ) : loadError ? (
        <div className="border-danger/40 bg-danger/5 rounded-xl border p-6 text-center">
          <p className="text-danger font-semibold">{loadError}</p>
          <p className="text-muted mt-2 text-sm">
            Refresh the page to try again.
          </p>
        </div>
      ) : snapshot ? (
        <ViewForTab tab={activeTab} snapshot={snapshot} />
      ) : null}
    </div>
  );
}
