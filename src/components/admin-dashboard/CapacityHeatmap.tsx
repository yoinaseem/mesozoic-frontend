import type { CapacityCell } from "@/lib/admin-dashboard";

type Props = {
  cells: CapacityCell[];
};

function shortDate(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// Pick a colour band by load. Empty slots stay dim; fully-booked rows get
// a stronger hue so dispatchers can scan a week's load at a glance.
function loadClass(booked: number, capacity: number): string {
  if (capacity === 0) return "bg-base/40 text-muted";
  const ratio = booked / capacity;
  if (ratio === 0) return "bg-base/30 text-muted";
  if (ratio < 0.4) return "bg-emerald-100 text-emerald-700";
  if (ratio < 0.75) return "bg-amber-100 text-amber-700";
  if (ratio < 1) return "bg-orange-100 text-orange-700";
  return "bg-rose-100 text-rose-700";
}

export function CapacityHeatmap({ cells }: Props) {
  // Pivot cells into rows (one per slot) × dates (columns).
  const dates = Array.from(new Set(cells.map((c) => c.date))).sort();
  type RowKey = string; // `${ferryName}|${routeLabel}|${scheduleId}`
  const rows = new Map<
    RowKey,
    {
      ferryName: string;
      routeLabel: string;
      scheduleId: number;
      byDate: Map<string, CapacityCell>;
    }
  >();

  for (const cell of cells) {
    const key = `${cell.ferryName}|${cell.routeLabel}|${cell.scheduleId}`;
    let row = rows.get(key);
    if (!row) {
      row = {
        ferryName: cell.ferryName,
        routeLabel: cell.routeLabel,
        scheduleId: cell.scheduleId,
        byDate: new Map(),
      };
      rows.set(key, row);
    }
    row.byDate.set(cell.date, cell);
  }

  const rowList = Array.from(rows.values()).sort((a, b) =>
    `${a.ferryName} ${a.routeLabel}`.localeCompare(
      `${b.ferryName} ${b.routeLabel}`,
    ),
  );

  return (
    <section className="border-base bg-surface flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
      <header>
        <h3 className="text-base-color text-base font-semibold">
          Ferry capacity — next 7 days
        </h3>
        <p className="text-muted text-xs">
          Booked seats vs. vessel capacity per slot per date
        </p>
      </header>

      {rowList.length === 0 ? (
        <p className="text-muted py-6 text-center text-sm">
          No published ferry slots yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="text-muted sticky left-0 bg-surface px-2 py-1 text-left font-medium">
                  Slot
                </th>
                {dates.map((d) => (
                  <th
                    key={d}
                    className="text-muted px-1 py-1 text-center font-medium"
                  >
                    {shortDate(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowList.map((row) => (
                <tr key={`${row.scheduleId}`}>
                  <td className="sticky left-0 bg-surface px-2 py-1.5 text-left">
                    <p className="text-base-color font-semibold">
                      {row.ferryName}
                    </p>
                    <p className="text-muted text-[0.65rem]">
                      {row.routeLabel}
                    </p>
                  </td>
                  {dates.map((d) => {
                    const cell = row.byDate.get(d);
                    if (!cell) {
                      return (
                        <td
                          key={d}
                          className="bg-base/30 text-muted rounded-md px-1 py-1.5 text-center text-[0.65rem]"
                        >
                          —
                        </td>
                      );
                    }
                    return (
                      <td
                        key={d}
                        className={`rounded-md px-1 py-1.5 text-center text-[0.7rem] font-semibold ${loadClass(
                          cell.booked,
                          cell.capacity,
                        )}`}
                        title={`${cell.booked}/${cell.capacity || "?"} guests`}
                      >
                        {cell.booked}/{cell.capacity || "?"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
