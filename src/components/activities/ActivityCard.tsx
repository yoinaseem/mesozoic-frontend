import Image from "next/image";
import type { ActivityItem } from "@/components/activities/activities-data";

type ActivityCardProps = {
  activity: ActivityItem;
};

export function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <article className="group flex flex-col rounded-lg border border-base bg-surface transition duration-200 ease-out hover:-translate-y-1 hover:ring-2 hover:ring-[var(--color-border)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg">
        <Image
          src={activity.imageSrc}
          alt={activity.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-300 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-primary">{activity.name}</h3>
        <p className="mt-2 text-muted">{activity.description}</p>
        <div className="mt-4">
          <button
            type="button"
            className="btn-accent transition duration-150 hover:opacity-95 active:opacity-90"
          >
            {activity.cta}
          </button>
        </div>
      </div>
    </article>
  );
}
