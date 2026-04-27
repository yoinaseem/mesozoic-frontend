"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DateCount } from "@/lib/admin-dashboard";

type Props = {
  data: DateCount[];
  title: string;
  subtitle?: string;
  // What we're counting on the Y axis. Defaults to "Bookings" so the existing
  // call sites keep their previous label without changes.
  yAxisLabel?: string;
};

function shortLabel(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function Next7DaysChart({
  data,
  title,
  subtitle,
  yAxisLabel = "Bookings",
}: Props) {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  const labelled = data.map((d) => ({ ...d, label: shortLabel(d.date) }));

  return (
    <section className="border-base bg-surface flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-base-color text-base font-semibold">{title}</h3>
          {subtitle ? <p className="text-muted text-xs">{subtitle}</p> : null}
        </div>
        <p className="text-primary text-lg font-bold">{total}</p>
      </header>

      {total === 0 ? (
        <p className="text-muted py-8 text-center text-sm">
          Nothing booked in the next 7 days.
        </p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={labelled}
              margin={{ top: 8, right: 12, left: 12, bottom: 24 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-border)"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              >
                <Label
                  value="Date"
                  position="insideBottom"
                  offset={-12}
                  style={{
                    fontSize: 12,
                    fill: "var(--foreground)",
                    fontWeight: 600,
                  }}
                />
              </XAxis>
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={48}
              >
                <Label
                  value={yAxisLabel}
                  angle={-90}
                  position="insideLeft"
                  offset={10}
                  style={{
                    fontSize: 12,
                    fill: "var(--foreground)",
                    fontWeight: 600,
                    textAnchor: "middle",
                  }}
                />
              </YAxis>
              <Tooltip
                cursor={{ fill: "var(--color-base)", opacity: 0.4 }}
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                }}
              />
              <Bar
                dataKey="count"
                fill="var(--color-accent)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
