export type RoomCardItem = {
  name: string;
  description: string;
  /** Optional query string for booking, e.g. `type=jungle-suite` */
  bookingQuery?: string;
};

export const roomTypes: RoomCardItem[] = [
  {
    name: "Standard Lodge",
    description: "Cozy lodge rooms with jungle views, queen bed, and rain shower.",
    bookingQuery: "type=standard-lodge",
  },
  {
    name: "Premium Jungle Suite",
    description: "Extra space, private balcony, and upgraded island amenities.",
    bookingQuery: "type=premium-jungle-suite",
  },
  {
    name: "Family Bunk Retreat",
    description: "Bunk beds plus a sofa bed—built for families and small groups.",
    bookingQuery: "type=family-bunk",
  },
  {
    name: "Cliffside Vista",
    description: "Panoramic lagoon views from the highest ridge on the property.",
    bookingQuery: "type=cliffside-vista",
  },
];

export const availableRooms: RoomCardItem[] = [
  {
    name: "Room 204 — Lagoon Wing",
    description: "Two queens, walk-in shower, steps from the lagoon boardwalk.",
    bookingQuery: "room=204",
  },
  {
    name: "Room 312 — Canopy Level",
    description: "King bed, treetop outlook, quiet end of the main lodge.",
    bookingQuery: "room=312",
  },
  {
    name: "Suite 401 — Raptor Ridge",
    description: "Separate living area, kitchenette, and private sunrise deck.",
    bookingQuery: "room=401",
  },
  {
    name: "Room 118 — Garden Ground",
    description: "Accessible route, twin beds, patio opening to fern gardens.",
    bookingQuery: "room=118",
  },
  {
    name: "Room 225 — Fossil Court",
    description: "Themed fossil accents, queen bed, near the dig-site shuttle stop.",
    bookingQuery: "room=225",
  },
];
