import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AttractionCard } from '@/components/attractions/AttractionCard';

const attractions = [
  {
    id: 1,
    title: "T-Rex Kingdom",
    description: "Experience the king of dinosaurs in a controlled, high-security environment.",
    imageUrl: "https://images.unsplash.com/photo-1525833329402-e21237c811e8?q=80&w=1000"
  },
  {
    id: 2,
    title: "Raptor Paddock Tour",
    description: "Go behind the scenes with our handlers and meet the cleverest girls in the park.",
    imageUrl: "https://images.unsplash.com/photo-1550353127-b0da3adff6c6?q=80&w=1000"
  },
  {
    id: 3,
    title: "Pterosaur Aviary",
    description: "Enter the world's largest bird cage and watch giants soar above your head.",
    imageUrl: "https://images.unsplash.com/photo-1606856094755-71f7832832bc?q=80&w=1000"
  }
];

export default function ActivitiesPage() {
  return (
    <>
      <Navbar />
      {/* UI Component Rule #2: Page Layout Structure */}
      <main className="bg-base min-h-screen">
        {/* UI Component Rule #3 & #10: Section Structure & Spacing */}
        <section className="py-24"> {/* Increased py to account for fixed navbar */}
          <div className="max-w-7xl mx-auto px-6">

            <header className="mb-12">
               <h1 className="text-5xl font-bold text-primary">
                 The Kingdom
               </h1>
               <p className="text-muted mt-4 text-lg max-w-2xl">
                 Explore our world-class prehistoric attractions and guided tours.
               </p>
            </header>

            {/* UI Component Rule #8: Grid Layouts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
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
      <Footer />
    </>
  );
}