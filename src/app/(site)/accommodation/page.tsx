import type { Metadata } from "next";
import { HotelCard } from "@/components/hotels/HotelCard";
import { fetchHotels } from "@/lib/api/server/hotels";

export const metadata: Metadata = {
  title: "Accommodation | Mesozoic Isle",
  description: "Browse hotels across Mesozoic Isle and explore the rooms available at each.",
};

export const revalidate = 300;

export default async function AccommodationPage() {
  const hotels = await fetchHotels();

  return (
    <div className="bg-base min-h-screen pt-[72px]">
      <section className="pt-16 pb-4 bg-linear-to-b from-primary/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <header className="mb-8">
            <h1 className="text-5xl font-bold text-primary mb-4">Accommodation</h1>
            <p className="text-muted text-lg max-w-2xl">
              Stay at one of our island hotels. Each location offers its own character,
              amenities, and room types — pick a hotel to see what&apos;s available.
            </p>
          </header>
        </div>
      </section>

      <section className="pt-4 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {hotels.length === 0 ? (
            <div className="flex justify-center items-center min-h-96">
              <p className="text-muted">No hotels available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
