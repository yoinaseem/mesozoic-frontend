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

import type { SpendBucket } from "@/lib/customer-dashboard";

type Props = {
  data: SpendBucket[];
};

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function SpendOverTimeChart({ data }: Props) {
  const total = data.reduce((acc, d) => acc + d.spend, 0);

  return (
    <section className="border-base bg-surface flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-base-color text-base font-semibold">
            Spend over time
          </h3>
          <p className="text-muted text-xs">Last 12 months</p>
        </div>
        <p className="text-primary text-lg font-bold">{formatMoney(total)}</p>
      </header>

      {total === 0 ? (
        <p className="text-muted py-8 text-center text-sm">
          No spend in the last 12 months yet.
        </p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
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
                  value="Month"
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
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                }
                tickLine={false}
                axisLine={false}
                width={56}
              >
                <Label
                  value="Revenue (USD)"
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
                formatter={(value) => [formatMoney(Number(value)), "Spend"]}
              />
              <Bar
                dataKey="spend"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
