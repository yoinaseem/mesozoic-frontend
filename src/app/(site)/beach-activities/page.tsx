import type { Metadata } from "next";
import Link from "next/link";
import { BeachActivityCard } from "@/components/beach-activities/BeachActivityCard";
import { fetchBeachActivities } from "@/lib/api/server/beach-activities";

export const metadata: Metadata = {
  title: "Beach Activities | Mesozoic Isle",
  description:
    "Browse guided beach adventures at Mesozoic Isle — snorkelling, water sports, and coastal explorations.",
};

export const revalidate = 300;

export default async function BeachActivitiesPage() {
  const activities = await fetchBeachActivities();

  return (
    <div className="bg-base min-h-screen pt-18">
      <section className="pt-16 pb-4 bg-linear-to-b from-primary/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <header className="mb-8">
            <h1 className="text-5xl font-bold text-primary mb-4">
              Island Beach Adventures
            </h1>
            <p className="text-muted text-lg">
              Experience the thrill of the ocean with our carefully curated
              selection of beach activities. From adrenaline-pumping water
              sports to serene coastal explorations, discover unforgettable
              moments on the island&apos;s pristine beaches. Each activity is
              guided by experienced professionals to ensure your safety and
              maximum enjoyment.
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
                  No beach activities available at the moment.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activities.map((activity) => (
                  <BeachActivityCard key={activity.id} activity={activity} />
                ))}
              </div>

              <div className="mt-16 text-center">
                <h2 className="text-2xl font-bold text-primary mb-4">
                  Ready for an adventure?
                </h2>
                <p className="text-muted mb-8 max-w-xl mx-auto">
                  Book your beach activity and make unforgettable memories on
                  the island.
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
