"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { formatMoney, type RoomTypeMixEntry } from "@/lib/admin-dashboard";

type Props = {
  data: RoomTypeMixEntry[];
};

// Recycle the BookingMix palette so the same dashboard reads consistently.
const PALETTE = [
  "#1E5A8A",
  "#E8A317",
  "#3DA5D9",
  "#9C5BAF",
  "#3D8B66",
  "#C0392B",
  "#16A085",
  "#8E44AD",
];

export function RoomTypeMixChart({ data }: Props) {
  const totalCount = data.reduce((acc, d) => acc + d.count, 0);
  const totalRevenue = data.reduce((acc, d) => acc + d.revenue, 0);

  return (
    <section className="border-base bg-surface flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-base-color text-base font-semibold">
            Most-booked room types
          </h3>
          <p className="text-muted text-xs">
            Confirmed room bookings, lifetime · revenue {formatMoney(totalRevenue)}
          </p>
        </div>
        <p className="text-primary text-lg font-bold">{totalCount} bookings</p>
      </header>

      {data.length === 0 ? (
        <p className="text-muted py-8 text-center text-sm">
          No confirmed room bookings yet.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.map((entry, idx) => (
                    <Cell
                      key={entry.roomTypeId}
                      fill={PALETTE[idx % PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                  formatter={(value, _name, item) => {
                    const payload = item?.payload as RoomTypeMixEntry | undefined;
                    if (!payload) return [`${value}`, String(_name)];
                    return [
                      `${payload.count} bookings · ${formatMoney(payload.revenue)}`,
                      payload.name,
                    ];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "0.7rem" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="text-base-color flex flex-col gap-2 text-sm">
            {data.map((entry, idx) => {
              const pct = totalCount === 0 ? 0 : (entry.count / totalCount) * 100;
              return (
                <li
                  key={entry.roomTypeId}
                  className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border)] pb-2 last:border-0 last:pb-0"
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block size-3 rounded-full"
                      style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                    />
                    <span className="flex flex-col">
                      <span className="font-medium">{entry.name}</span>
                      <span className="text-muted text-xs">
                        {entry.hotelName}
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-semibold">{entry.count}</span>
                    <span className="text-muted text-xs">
                      {pct.toFixed(1)}% · {formatMoney(entry.revenue)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
