import React from 'react';
import AttractionsCard from '@/components/attractions/AttractionsCard';

const ATTRACTIONS_DATA = [
  {
    id: '1',
    title: "T-Rex Encounter",
    description: "Experience the sheer power of the island's most famous resident from the safety of our reinforced observation pods.",
    imageSrc: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop",
    imageAlt: "T-Rex in a jungle environment",
    isBooking: true
  },
  {
    id: '2',
    title: "Pterosaur Aviary",
    description: "Walk through the world's largest geodesic dome and watch Pteranodons dive for fish in the central lagoon.",
    imageSrc: "https://images.unsplash.com/photo-1550303836-8349f7b60582?q=80&w=1000&auto=format&fit=crop",
    imageAlt: "Flying dinosaurs above water",
    isBooking: false
  },
  {
    id: '3',
    title: "Triceratops Safari",
    description: "A gentle journey through the Cretaceous plains. Perfect for families looking to meet our three-horned friends.",
    imageSrc: "https://images.unsplash.com/photo-1559997409-47167667468e?q=80&w=1000&auto=format&fit=crop",
    imageAlt: "Triceratops in a field",
    isBooking: true
  }
];

export default function AttractionsPage() {
  return (
    <main className="min-h-screen bg-base">
      {/* Page Header / Hero */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-primary">Island Attractions</h1>
          <p className="text-muted mt-4 max-w-2xl text-lg">
            From the depths of the ocean to the highest peaks of the aviary, 
            discover the prehistoric marvels of Mesozoic Isle.
          </p>
        </div>
      </section>

      {/* Grid of Cards */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ATTRACTIONS_DATA.map((item) => (
              <AttractionsCard
                key={item.id}
                title={item.title}
                description={item.description}
                imageSrc={item.imageSrc}
                imageAlt={item.imageAlt}
                isBookingAction={item.isBooking}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-surface border-y border-base">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-primary">Plan Your Visit</h2>
          <p className="text-muted mt-2 mb-8">Packages start from $199. Limited availability for summer.</p>
          <button className="btn-accent px-8 py-3">View All Tickets</button>
        </div>
      </section>
    </main>
  );
}