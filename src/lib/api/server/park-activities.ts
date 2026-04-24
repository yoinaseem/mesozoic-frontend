import "server-only";

import type { ParkActivity, ThemePark } from "@/types/booking";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300, tags: ["park-activities"] },
  });
  if (!res.ok) {
    throw new Error(`Failed to load ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchParkActivities(): Promise<ParkActivity[]> {
  const parks = await fetchJson<{ data: ThemePark[] }>("/api/theme-parks");

  const activitySets = await Promise.all(
    parks.data.map((park) =>
      fetchJson<{ data: ParkActivity[] }>(`/api/theme-parks/${park.id}/activities`),
    ),
  );

  return activitySets.flatMap((set) => set.data);
}
