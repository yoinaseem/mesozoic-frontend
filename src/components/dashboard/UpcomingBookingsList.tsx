import {
  Bed,
  CalendarHeart,
  Sailboat,
  TicketCheck,
  Waves,
  type LucideIcon,
} from "lucide-react";

import type { UpcomingBookingItem } from "@/lib/customer-dashboard";

type Props = {
  items: UpcomingBookingItem[];
};

const ICONS: Record<UpcomingBookingItem["type"], LucideIcon> = {
  room: Bed,
  park: TicketCheck,
  beach: Waves,
  activity: CalendarHeart,
  ferry: Sailboat,
};

const TYPE_LABELS: Record<UpcomingBookingItem["type"], string> = {
  room: "Stay",
  park: "Park ticket",
  beach: "Beach",
  activity: "Park activity",
  ferry: "Ferry",
};

export function UpcomingBookingsList({ items }: Props) {
  return (
    <section className="border-base bg-surface flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-base-color text-base font-semibold">
            Upcoming bookings
          </h3>
          <p className="text-muted text-xs">
            The next {items.length === 0 ? "few" : items.length} item
            {items.length === 1 ? "" : "s"} on your calendar
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="text-muted py-6 text-center text-sm">
          Nothing scheduled yet — book a stay to see your itinerary here.
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
                </div>
                <p className="text-muted shrink-0 text-xs">
                  {item.guests} guest{item.guests === 1 ? "" : "s"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
