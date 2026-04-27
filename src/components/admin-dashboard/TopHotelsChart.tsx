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

import { formatMoney, type TopHotelEntry } from "@/lib/admin-dashboard";

type Props = {
  data: TopHotelEntry[];
};

export function TopHotelsChart({ data }: Props) {
  return (
    <section className="border-base bg-surface flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
      <header>
        <h3 className="text-base-color text-base font-semibold">
          Top hotels by revenue
        </h3>
        <p className="text-muted text-xs">
          Confirmed room bookings, lifetime
        </p>
      </header>

      {data.length === 0 ? (
        <p className="text-muted py-8 text-center text-sm">
          No hotel revenue yet.
        </p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 28 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="var(--color-border)"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                }
                tickLine={false}
                axisLine={false}
              >
                <Label
                  value="Revenue (USD)"
                  position="insideBottom"
                  offset={-16}
                  style={{
                    fontSize: 12,
                    fill: "var(--foreground)",
                    fontWeight: 600,
                  }}
                />
              </XAxis>
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={140}
              >
                <Label
                  value="Hotel"
                  angle={-90}
                  position="insideLeft"
                  offset={-4}
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
                formatter={(value) => [formatMoney(Number(value)), "Revenue"]}
              />
              <Bar
                dataKey="revenue"
                fill="var(--color-primary)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
