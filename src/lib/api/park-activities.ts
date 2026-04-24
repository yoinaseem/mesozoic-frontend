import { apiRequest } from "@/lib/api-client";
import type { ParkActivity } from "@/types/booking";

type DataEnvelope<T> = { data: T };

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
