export type RoomType = {
  id: number;
  hotelId: number;
  name: string;
  description: string | null;
  image: string | null;
  capacity: number;
  price: number;
  amenities: string[];
};

export const roomTypes: RoomType[] = [
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

export function getRoomTypeById(id: number) {
  return roomTypes.find((roomType) => roomType.id === id) ?? null;
}
