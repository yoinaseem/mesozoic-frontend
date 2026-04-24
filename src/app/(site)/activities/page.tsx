import type { Metadata } from "next";
import Link from "next/link";
import { ParkActivityCard } from "@/components/park-activities/ParkActivityCard";
import { fetchParkActivities } from "@/lib/api/server/park-activities";

export const metadata: Metadata = {
  title: "The Kingdom | Mesozoic Isle",
  description:
    "Discover thrilling park activities at Mesozoic Isle — guided expeditions, encounters, and prehistoric wonders.",
};

export const revalidate = 300;

export default async function ActivitiesPage() {
  const activities = await fetchParkActivities();

  return (
    <div className="bg-base min-h-screen pt-[72px]">
      <section className="pt-16 pb-4 bg-linear-to-b from-primary/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <header>
            <h1 className="text-5xl font-bold text-primary">The Kingdom</h1>
            <p className="text-muted mt-4 text-lg max-w-2xl">
              Step into a world unlike any other. Discover thrilling park
              attractions, guided expeditions, and prehistoric wonders hidden
              deep within Mesozoic Isle.
            </p>
          </header>
        </div>
      </section>

      <section className="pt-4 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {activities.length === 0 ? (
            <div className="flex justify-center items-center min-h-96">
              <div className="text-center">
                <p className="text-muted">
                  No park activities available at the moment.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activities.map((activity) => (
                  <ParkActivityCard key={activity.id} activity={activity} />
                ))}
              </div>

              <div className="mt-16 text-center">
                <h2 className="text-2xl font-bold text-primary mb-4">
                  Ready to explore The Kingdom?
                </h2>
                <p className="text-muted mb-8 max-w-xl mx-auto">
                  Book your park activity and experience the wonders of Mesozoic Isle up close.
                </p>
                <Link href="/book">
                  <button className="btn-accent px-8 py-3 text-lg">
                    Book Your Activity
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
