import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { BeachActivity, BeachActivitySchedule } from "@/types/booking";

export async function listBeachActivities() {
  return apiRequest<{ data: BeachActivity[] }>("/beach-activities", {
    skipAuth: true,
  });
}

export async function getBeachActivity(activityId: number) {
  return apiRequest<{ data: BeachActivity }>(
    `/beach-activities/${activityId}`,
    { skipAuth: true },
  );
}

export async function listBeachActivitySchedules(activityId: number, page = 1) {
  return apiRequest<Paginated<BeachActivitySchedule>>(
    `/beach-activities/${activityId}/schedules?page=${page}`,
    { skipAuth: true },
  );
}
