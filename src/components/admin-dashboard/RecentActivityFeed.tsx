import {
  Bed,
  CalendarHeart,
  Sailboat,
  TicketCheck,
  Waves,
  type LucideIcon,
} from "lucide-react";

import { formatMoney, type ActivityItem } from "@/lib/admin-dashboard";

type Props = {
  items: ActivityItem[];
  title?: string;
};

const ICONS: Record<ActivityItem["type"], LucideIcon> = {
  room: Bed,
  park: TicketCheck,
  beach: Waves,
  activity: CalendarHeart,
  ferry: Sailboat,
};

const TYPE_LABELS: Record<ActivityItem["type"], string> = {
  room: "Stay",
  park: "Park ticket",
  beach: "Beach",
  activity: "Park activity",
  ferry: "Ferry",
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function RecentActivityFeed({
  items,
  title = "Recent activity",
}: Props) {
  return (
    <section className="border-base bg-surface flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
      <header>
        <h3 className="text-base-color text-base font-semibold">{title}</h3>
        <p className="text-muted text-xs">
          Latest {items.length} booking{items.length === 1 ? "" : "s"} across
          every channel
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-muted py-6 text-center text-sm">
          No recent bookings yet.
        </p>
      ) : (
        <ul className="divide-base divide-y">
          {items.map((item) => {
            const Icon = ICONS[item.type];
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="bg-base/60 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-base-color truncate text-sm font-semibold">
                      {item.title}
                    </p>
                    <span className="text-muted shrink-0 text-xs uppercase tracking-wide">
                      {TYPE_LABELS[item.type]}
                    </span>
                  </div>
                  <p className="text-muted truncate text-xs">{item.subtitle}</p>
                  <p className="text-muted mt-0.5 text-xs">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <p className="text-primary shrink-0 text-sm font-semibold">
                  {formatMoney(item.amount)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
