import type { Metadata } from "next";
import { RoomCard } from "@/components/rooms/RoomCard";
import { fetchRoomTypes } from "@/lib/api/server/room-types";

export const metadata: Metadata = {
  title: "Accommodation | Mesozoic Isle",
  description: "Browse accommodation and room types available at Mesozoic Isle.",
};

export const revalidate = 300;

export default async function AccommodationPage() {
  const roomTypes = await fetchRoomTypes();

  return (
    <div className="bg-base min-h-full">
      <section className="pt-28 pb-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 className="text-5xl font-bold text-primary">Accommodation</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Choose from curated room types across our island hotels. Each option includes
            transparent pricing, capacity, and key amenities.
          </p>
        </div>
      </section>

      <section className="border-t border-base py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-base-color">Available room types</h2>
          <p className="mt-2 text-muted">
            Powered by the room-type schema: name, description, image, capacity, price, and
            amenities.
          </p>
          {roomTypes.length === 0 ? (
            <div className="mt-12 flex justify-center">
              <p className="text-muted">No room types available at the moment.</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roomTypes.map((roomType) => (
                <RoomCard key={roomType.id} roomType={roomType} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
