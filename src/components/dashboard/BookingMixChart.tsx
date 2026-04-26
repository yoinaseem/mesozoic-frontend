"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { MixSlice } from "@/lib/customer-dashboard";

type Props = {
  data: MixSlice[];
};

// Distinct hues per booking type — picked to read at a glance against the
// theme's primary/accent palette.
const COLORS: Record<MixSlice["type"], string> = {
  Rooms: "#1E5A8A",
  "Park tickets": "#E8A317",
  "Beach activities": "#3DA5D9",
  "Park activities": "#9C5BAF",
  Ferries: "#3D8B66",
};

export function BookingMixChart({ data }: Props) {
  const filtered = data.filter((d) => d.count > 0);
  const totalCount = filtered.reduce((acc, d) => acc + d.count, 0);

  return (
    <section className="border-base bg-surface flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-base-color text-base font-semibold">
            Booking mix
          </h3>
          <p className="text-muted text-xs">By count, lifetime</p>
        </div>
        <p className="text-primary text-lg font-bold">{totalCount} total</p>
      </header>

      {filtered.length === 0 ? (
        <p className="text-muted py-8 text-center text-sm">
          No bookings yet — once you book something it&rsquo;ll show up here.
        </p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filtered}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {filtered.map((entry) => (
                  <Cell key={entry.type} fill={COLORS[entry.type]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                }}
                formatter={(value, name) => [`${value}`, String(name)]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: "0.7rem" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
