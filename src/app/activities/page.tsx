import React from 'react';
import { AttractionCard } from '@/components/attractions/AttractionCard';

const attractions = [
  {
    id: 1,
    title: "T-Rex Kingdom",
    description: "Experience the king of dinosaurs in a controlled, high-security environment.",
    imageUrl: "/images/trex.jpg"
  },
  {
    id: 2,
    title: "Raptor Paddock Tour",
    description: "Go behind the scenes with our handlers and meet the cleverest girls in the park.",
    imageUrl: "/images/raptors.jpg"
  },
  {
    id: 3,
    title: "Pterosaur Aviary",
    description: "Enter the world's largest bird cage and watch giants soar above your head.",
    imageUrl: "/images/aviary.jpg"
  }
];

export default function ActivitiesPage() {
  return (
    // Component Rule #2: Page Layout Structure
    <main className="bg-base min-h-screen">
      
      {/* Component Rule #3 & #10: Section Structure & Spacing (py-16) */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-3xl font-bold text-primary">
            The Kingdom
          </h2>

          <p className="text-muted mt-2 text-lg">
            Explore our world-class prehistoric attractions and guided tours.
          </p>

          {/* Component Rule #8: Grid Layouts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {attractions.map((item) => (
              <AttractionCard 
                key={item.id}
                title={item.title}
                description={item.description}
                imageUrl={item.imageUrl}
              />
            ))}
          </div>

        </div>
      </section>
    </main>
  );
}