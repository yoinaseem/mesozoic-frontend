import { ActivityCard } from "@/components/activities/ActivityCard";
import type { ActivityCategory } from "@/components/activities/activities-data";

type ActivityCategorySectionProps = {
  category: ActivityCategory;
};

export function ActivityCategorySection({ category }: ActivityCategorySectionProps) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-base-color">{category.title}</h2>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {category.activities.map((activity) => (
          <ActivityCard key={activity.name} activity={activity} />
        ))}
      </div>
    </div>
  );
}
