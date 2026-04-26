import { CalendarOff } from "lucide-react";

import type { ParkClosure } from "@/lib/admin-dashboard";

type Props = {
  closures: ParkClosure[];
};

export function ClosuresWidget({ closures }: Props) {
  return (
    <section className="border-base bg-surface flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
      <header>
        <h3 className="text-base-color text-base font-semibold">
          Upcoming park closures
        </h3>
        <p className="text-muted text-xs">
          Override-driven closures from today onward
        </p>
      </header>

      {closures.length === 0 ? (
        <p className="text-muted py-6 text-center text-sm">
          No park closures on the books.
        </p>
      ) : (
        <ul className="divide-base divide-y">
          {closures.map((c) => (
            <li
              key={`${c.parkId}-${c.date}`}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="bg-rose-100 text-rose-700 flex size-9 shrink-0 items-center justify-center rounded-lg">
                <CalendarOff className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-base-color truncate text-sm font-semibold">
                    {c.parkName}
                  </p>
                  <p className="text-muted shrink-0 text-xs">{c.date}</p>
                </div>
                {c.note ? (
                  <p className="text-muted truncate text-xs">{c.note}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
