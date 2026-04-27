"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SignupBucket } from "@/lib/admin-dashboard";

type Props = {
  data: SignupBucket[];
};

export function SignupsOverTimeChart({ data }: Props) {
  const total = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <section className="border-base bg-surface flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-base-color text-base font-semibold">
            Customer signups
          </h3>
          <p className="text-muted text-xs">Last 12 months</p>
        </div>
        <p className="text-primary text-lg font-bold">{total}</p>
      </header>

      {total === 0 ? (
        <p className="text-muted py-8 text-center text-sm">
          No new customers in the last 12 months.
        </p>
      ) : (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 12, left: 12, bottom: 24 }}
            >
              <defs>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={48}
              >
                <Label
                  value="New customers"
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
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#signupGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
