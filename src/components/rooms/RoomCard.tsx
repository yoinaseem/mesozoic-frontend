import Link from "next/link";
import type { RoomCardItem } from "@/components/rooms/rooms-data";

type RoomCardProps = {
  item: RoomCardItem;
  variant: "type" | "room";
};

function bookingHref(query?: string) {
  const base = "/booking";
  if (!query) return base;
  return `${base}?${query}`;
}

export function RoomCard({ item, variant }: RoomCardProps) {
  const href = bookingHref(item.bookingQuery);
  const topClass =
    variant === "type"
      ? "h-32 w-full bg-primary"
      : "h-32 w-full border-b border-base bg-surface";

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-base bg-surface transition duration-200 ease-out hover:-translate-y-1 hover:ring-2 hover:ring-[var(--color-border)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
      <div className={topClass} aria-hidden />
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-primary">{item.name}</h3>
        <p className="mt-2 text-muted">{item.description}</p>
        <div className="mt-4">
          <Link href={href} className="btn-accent inline-block text-center">
            Book Now
          </Link>
        </div>
      </div>
    </article>
  );
}
