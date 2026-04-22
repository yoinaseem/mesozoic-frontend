import type { Metadata } from "next";
import { RoomCard, type RoomType } from "@/components/rooms/RoomCard";

export const metadata: Metadata = {
  title: "Accommodation | Mesozoic Isle",
  description: "Browse accommodation and room types available at Mesozoic Isle.",
};

const roomTypes: RoomType[] = [
  {
    id: 1,
    hotelId: 1,
    name: "Standard Jungle Room",
    description: "Comfortable base camp room with nature-facing windows.",
    image: "/img/banner.avif",
    capacity: 2,
    price: 179.0,
    amenities: ["Queen bed", "Rain shower", "Wi-Fi", "Breakfast"],
  },
  {
    id: 2,
    hotelId: 1,
    name: "Family Fossil Suite",
    description: "Large family suite with separate sleeping zone and lounge.",
    image: "/img/banner.avif",
    capacity: 4,
    price: 289.0,
    amenities: ["2 queen beds", "Mini fridge", "Balcony", "Breakfast"],
  },
  {
    id: 3,
    hotelId: 2,
    name: "Raptor Ridge Deluxe",
    description: "Premium mountain-side room with panoramic lagoon views.",
    image: "/img/banner.avif",
    capacity: 3,
    price: 329.0,
    amenities: ["King bed", "Private deck", "Smart TV", "Shuttle pass"],
  },
  {
    id: 4,
    hotelId: 2,
    name: "Explorer Twin Lodge",
    description: "Twin setup for friends and adventure groups.",
    image: "/img/banner.avif",
    capacity: 2,
    price: 199.0,
    amenities: ["Twin beds", "Work desk", "Wi-Fi", "Breakfast"],
  },
  {
    id: 5,
    hotelId: 3,
    name: "Lagoon Signature Villa",
    description: "High-end villa near the water trail and safari pickup point.",
    image: "/img/banner.avif",
    capacity: 5,
    price: 459.0,
    amenities: ["2 bedrooms", "Kitchenette", "Private terrace", "Concierge"],
  },
];

export default function AccommodationPage() {
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
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roomTypes.map((roomType) => (
              <RoomCard key={roomType.id} roomType={roomType} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
