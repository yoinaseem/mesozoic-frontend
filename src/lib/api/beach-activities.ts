import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { BeachActivity, BeachActivitySchedule } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export async function listBeachActivities(page = 1) {
  return apiRequest<Paginated<BeachActivity>>(`/beach-activities?page=${page}`, {
    skipAuth: true,
  });
}

export async function getBeachActivity(activityId: number) {
  return apiRequest<DataEnvelope<BeachActivity>>(
    `/beach-activities/${activityId}`,
    { skipAuth: true },
  );
}

export type BeachActivityInput = {
  name: string;
  description?: string | null;
  price: number;
  capacity: number;
  duration: number;
  image?: string | null;
};

export async function createBeachActivity(input: BeachActivityInput) {
  return apiRequest<DataEnvelope<BeachActivity>>(`/beach-activities`, {
    method: "POST",
    body: input,
  });
}

export async function updateBeachActivity(
  activityId: number,
  input: Partial<BeachActivityInput>,
) {
  return apiRequest<DataEnvelope<BeachActivity>>(
    `/beach-activities/${activityId}`,
    { method: "PATCH", body: input },
  );
}

export async function deleteBeachActivity(activityId: number) {
  return apiRequest<null>(`/beach-activities/${activityId}`, {
    method: "DELETE",
  });
}

export async function listBeachActivitySchedules(activityId: number, page = 1) {
  return apiRequest<Paginated<BeachActivitySchedule>>(
    `/beach-activities/${activityId}/schedules?page=${page}`,
    { skipAuth: true },
  );
}
