import type { Metadata } from "next";
import { ActivityCategorySection } from "@/components/activities/ActivityCategorySection";
import { activityCategories } from "@/components/activities/activities-data";

export const metadata: Metadata = {
  title: "Activities | Mesozoic Isle",
  description:
    "Explore dinosaur encounters, jungle trails, lagoon adventures, and live shows at Mesozoic Isle.",
};

export default function ActivitiesPage() {
  return (
    <div className="bg-base min-h-screen">
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 className="text-5xl font-bold text-primary">Activities</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Roam Jurassic trails, meet prehistoric stars, and book the adventures that fit your
            Mesozoic Isle day—safaris, treks, water routes, and arena shows in one place.
          </p>
        </div>
      </section>

      {activityCategories.map((category, index) => (
        <section
          key={category.title}
          className={`py-16 ${index > 0 ? "border-t border-base" : ""}`}
        >
          <div className="mx-auto max-w-7xl px-6">
            <ActivityCategorySection category={category} />
          </div>
        </section>
      ))}
    </div>
  );
}
