import "server-only";

import type { Hotel, RoomType } from "@/types/booking";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300, tags: ["room-types"] },
  });
  if (!res.ok) {
    throw new Error(`Failed to load ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// Room types are nested under hotels (`/hotels/{id}/room-types`); no top-level
// list endpoint exists. Walk hotels, fan out, flatten.
export async function fetchRoomTypes(): Promise<RoomType[]> {
  const hotels = await fetchJson<{ data: Hotel[] }>("/api/hotels");

  const typeSets = await Promise.all(
    hotels.data.map((hotel) =>
      fetchJson<{ data: RoomType[] }>(`/api/hotels/${hotel.id}/room-types`),
    ),
  );

  return typeSets.flatMap((set) => set.data);
}
