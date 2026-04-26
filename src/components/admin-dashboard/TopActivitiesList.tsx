import type { TopActivityEntry } from "@/lib/admin-dashboard";

type Props = {
  data: TopActivityEntry[];
  title: string;
  subtitle?: string;
};

export function TopActivitiesList({ data, title, subtitle }: Props) {
  const max = data[0]?.count ?? 0;

  return (
    <section className="border-base bg-surface flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
      <header>
        <h3 className="text-base-color text-base font-semibold">{title}</h3>
        {subtitle ? <p className="text-muted text-xs">{subtitle}</p> : null}
      </header>

      {data.length === 0 ? (
        <p className="text-muted py-6 text-center text-sm">
          No bookings yet — leaderboards populate as activities get booked.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.map((entry) => {
            const ratio = max === 0 ? 0 : entry.count / max;
            return (
              <li key={entry.activityId} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <p className="text-base-color truncate font-medium">
                    {entry.name}
                  </p>
                  <p className="text-primary shrink-0 font-semibold">
                    {entry.count}
                  </p>
                </div>
                <div className="bg-base/60 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full"
                    style={{ width: `${Math.max(8, Math.round(ratio * 100))}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
