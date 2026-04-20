import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type {
  EffectiveHour,
  ParkActivity,
  ParkActivitySchedule,
  ThemePark,
} from "@/types/booking";

export async function listThemeParks() {
  return apiRequest<{ data: ThemePark[] }>("/theme-parks", { skipAuth: true });
}

export async function getThemePark(parkId: number) {
  return apiRequest<{ data: ThemePark }>(`/theme-parks/${parkId}`, {
    skipAuth: true,
  });
}

export async function listParkActivities(parkId: number) {
  return apiRequest<{ data: ParkActivity[] }>(
    `/theme-parks/${parkId}/activities`,
    { skipAuth: true },
  );
}

export async function listParkActivitySchedules(
  parkId: number,
  activityId: number,
  page = 1,
) {
  return apiRequest<Paginated<ParkActivitySchedule>>(
    `/theme-parks/${parkId}/activities/${activityId}/schedules?page=${page}`,
    { skipAuth: true },
  );
}

type EffectiveHoursQuery =
  | { date: string }
  | { from: string; to: string };

export async function getEffectiveHours(
  parkId: number,
  query: EffectiveHoursQuery,
) {
  const params = new URLSearchParams(query as Record<string, string>);
  return apiRequest<{ data: EffectiveHour[] } | EffectiveHour[]>(
    `/theme-parks/${parkId}/effective-hours?${params}`,
    { skipAuth: true },
  );
}
