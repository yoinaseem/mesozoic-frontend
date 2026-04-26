"use client";

import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { PageHeader } from "@/components/admin/PageHeader";
import { FerryTypesSection } from "@/components/admin/ferry/FerryTypesSection";

// Unified ferries page: lists ferry types with expandable rows showing
// vessels under each. Mirrors how `/admin/hotels/[id]` lays out room types
// with expandable rooms underneath. Vessel dashboard for slot management is
// still at `/admin/ferries/[id]` — the panel row navigates there.
export default function FerriesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Ferries" },
        ]}
      />
      <PageHeader
        title="Ferries"
        description="Ferry types and the vessels under each. Click a type to reveal its vessels; click a vessel to manage its slots."
      />
      <FerryTypesSection />
    </div>
  );
}
