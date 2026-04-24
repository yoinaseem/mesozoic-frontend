import Link from "next/link";
import { ParkActivityCard } from "@/components/park-activities/ParkActivityCard";

const parkActivities = [
  {
    id: 1,
    name: "T-Rex Territory Trek",
    description: "Journey deep into the restricted zone for a heart-pounding guided walk through T-Rex nesting grounds. Rangers ensure your safety on this once-in-a-lifetime encounter.",
    price: 120,
    duration: 90,
    max_capacity: 10,
    imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800",
  },
  {
    id: 2,
    name: "Raptor Run",
    description: "Race alongside trained velociraptors in a controlled open savannah. The ultimate adrenaline experience for thrill-seekers on the island.",
    price: 95,
    duration: 60,
    max_capacity: 8,
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800",
  },
  {
    id: 3,
    name: "Brachiosaurus Safari",
    description: "Board our open-top safari vehicles and cruise through the lush valley where towering Brachiosauruses roam freely among the ancient ferns.",
    price: 75,
    duration: 120,
    max_capacity: 20,
    imageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=800",
  },
  {
    id: 4,
    name: "Triceratops Feeding Experience",
    description: "Get up close and personal with our gentle Triceratops herd. Hand-feed them native island vegetation under the supervision of our expert animal care team.",
    price: 55,
    duration: 45,
    max_capacity: 15,
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800",
  },
  {
    id: 5,
    name: "Jurassic Night Walk",
    description: "Experience the park after dark on this exclusive nocturnal tour. Witness prehistoric creatures in their nighttime element — a haunting and unforgettable adventure.",
    price: 110,
    duration: 150,
    max_capacity: 12,
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
  },
  {
    id: 6,
    name: "Pterodactyl Aerial Viewing",
    description: "Ascend the island's highest observation tower and watch pterodactyls soar overhead at eye level. Our guides share fascinating insights into these magnificent creatures.",
    price: 40,
    duration: 60,
    max_capacity: 30,
    imageUrl: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?q=80&w=800",
  },
];

export default function ActivitiesPage() {
  return (
    <div className="bg-base min-h-screen pt-[72px]">
      {/* Hero */}
      <section className="pt-16 pb-4 bg-gradient-to-b from-primary/10 to-transparent">
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

      {/* Activities */}
      <section className="pt-4 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {parkActivities.map((activity) => (
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
        </div>
      </section>
    </div>
  );
}
