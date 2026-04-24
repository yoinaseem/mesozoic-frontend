import "server-only";

import type { BeachActivity } from "@/types/booking";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

export async function fetchBeachActivities(): Promise<BeachActivity[]> {
  const res = await fetch(`${API_BASE}/api/beach-activities`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300, tags: ["beach-activities"] },
  });

  if (!res.ok) {
    throw new Error(`Failed to load beach activities (${res.status})`);
  }

  const json = (await res.json()) as { data: BeachActivity[] };
  return json.data;
}
