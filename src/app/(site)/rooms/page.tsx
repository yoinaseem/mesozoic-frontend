import type { Metadata } from "next";
import { RoomCard } from "@/components/rooms/RoomCard";
import { availableRooms, roomTypes } from "@/components/rooms/rooms-data";

export const metadata: Metadata = {
  title: "Rooms | Mesozoic Isle",
  description: "Browse room types and available lodge rooms at Mesozoic Isle.",
};

export default function RoomsPage() {
  return (
    <div className="bg-base min-h-full">
      <section className="pt-28 pb-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 className="text-5xl font-bold text-primary">Rooms</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Choose a room type that fits your adventure, then pick an available room. Every stay
            includes island trails, lagoon access, and our Mesozoic welcome pack.
          </p>
        </div>
      </section>

      <section className="border-t border-base py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-base-color">Room types</h2>
          <p className="mt-2 text-muted">Styles and layouts across our lodges and villas.</p>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roomTypes.map((item) => (
              <RoomCard key={item.name} item={item} variant="type" />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-base py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-base-color">Available rooms</h2>
          <p className="mt-2 text-muted">Hand-picked inventory open for the next season.</p>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableRooms.map((item) => (
              <RoomCard key={item.name} item={item} variant="room" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
