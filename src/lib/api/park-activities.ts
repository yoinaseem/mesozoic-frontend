import { apiRequest } from "@/lib/api-client";
import type { ParkActivity } from "@/types/booking";

type DataEnvelope<T> = { data: T };

// DESD-95: `max_capacity` must be ≤ park.capacity (server enforces); the
// admin form mirrors the constraint by passing the park's capacity in.
export type ParkActivityInput = {
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  duration?: number | null;
  max_capacity: number;
  is_all_day?: boolean;
};

export async function getParkActivity(parkId: number, activityId: number) {
  return apiRequest<DataEnvelope<ParkActivity>>(
    `/theme-parks/${parkId}/activities/${activityId}`,
    { skipAuth: true },
  );
}

export async function createParkActivity(
  parkId: number,
  input: ParkActivityInput,
) {
  return apiRequest<DataEnvelope<ParkActivity>>(
    `/theme-parks/${parkId}/activities`,
    { method: "POST", body: input },
  );
}

export async function updateParkActivity(
  parkId: number,
  activityId: number,
  input: Partial<ParkActivityInput>,
) {
  return apiRequest<DataEnvelope<ParkActivity>>(
    `/theme-parks/${parkId}/activities/${activityId}`,
    { method: "PATCH", body: input },
  );
}

export async function deleteParkActivity(parkId: number, activityId: number) {
  return apiRequest<null>(`/theme-parks/${parkId}/activities/${activityId}`, {
    method: "DELETE",
  });
}

// DESD-95: activities are soft-deleted. 409 if parent park is still archived.
export async function restoreParkActivity(parkId: number, activityId: number) {
  return apiRequest<DataEnvelope<ParkActivity>>(
    `/theme-parks/${parkId}/activities/${activityId}/restore`,
    { method: "POST" },
  );
}
