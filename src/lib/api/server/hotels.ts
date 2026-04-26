import "server-only";

import type { Hotel } from "@/types/booking";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

async function fetchJson<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300, tags: ["hotels"] },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchHotels(): Promise<Hotel[]> {
  const json = await fetchJson<{ data: Hotel[] }>("/api/hotels");
  return json?.data ?? [];
}

// `GET /hotels/{id}` eager-loads `room_types` per API_INTEGRATION.md §5,
// so a single fetch covers the detail page header + the room-type grid.
// Returns null on 404 so the page can call `notFound()`.
export async function fetchHotel(hotelId: number): Promise<Hotel | null> {
  const json = await fetchJson<{ data: Hotel }>(`/api/hotels/${hotelId}`);
  return json?.data ?? null;
}
