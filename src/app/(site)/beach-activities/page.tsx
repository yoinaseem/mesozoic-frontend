import React from 'react';
import Link from 'next/link';

const beachActivities = [
  {
    id: 1,
    title: "Lagoon Kayaking",
    description: "Paddle through crystal-clear prehistoric lagoons surrounded by lush jungle canopy and ancient rock formations.",
    imageUrl: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?q=80&w=1000"
  },
  {
    id: 2,
    title: "Coral Reef Snorkeling",
    description: "Dive beneath the surface and discover a vibrant underwater world teeming with exotic marine life.",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1000"
  },
  {
    id: 3,
    title: "Sunset Sailing",
    description: "Set sail along the island coast as the sun dips below the horizon in a blaze of amber and gold.",
    imageUrl: "https://images.unsplash.com/photo-1500514966906-fe245eea9344?q=80&w=1000"
  },
  {
    id: 4,
    title: "Jungle Beach Hike",
    description: "Trek through dense prehistoric jungle trails that open onto secluded white-sand beaches.",
    imageUrl: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1000"
  },
  {
    id: 5,
    title: "Pterosaur Coastal Watch",
    description: "Join our rangers on the shoreline cliffs for an up-close encounter with coastal pterosaurs at dusk.",
    imageUrl: "https://images.unsplash.com/photo-1606856094755-71f7832832bc?q=80&w=1000"
  },
  {
    id: 6,
    title: "Deep Sea Fishing",
    description: "Venture into open waters on a guided deep-sea expedition and reel in the catch of a lifetime.",
    imageUrl: "https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?q=80&w=1000"
  }
];

export default function BeachActivitiesPage() {
  return (
    <div className="bg-base min-h-screen">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">

          <header className="mb-12">
            <h1 className="text-5xl font-bold text-primary">Beach Activities</h1>
            <p className="text-muted mt-4 text-lg max-w-2xl">
              From coastal kayaking to jungle treks, discover the island's most
              thrilling waterfront experiences.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {beachActivities.map((activity) => (
              <div key={activity.id} className="card h-full flex flex-col">
                <img
                  src={activity.imageUrl}
                  alt={activity.title}
                  className="rounded-lg w-full h-64 object-cover"
                />
                <div className="flex flex-col flex-grow mt-4">
                  <h3 className="text-xl font-bold text-primary">{activity.title}</h3>
                  <p className="text-muted mt-2 flex-grow">{activity.description}</p>
                  <Link href="/booking" className="mt-4">
                    <button className="btn-accent w-full">Book Now</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}