import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type {
  EffectiveHour,
  ParkActivity,
  ParkActivitySchedule,
  ThemePark,
} from "@/types/booking";

type DataEnvelope<T> = { data: T };

export async function listThemeParks() {
  return apiRequest<{ data: ThemePark[] }>("/theme-parks", { skipAuth: true });
}

export async function getThemePark(parkId: number) {
  return apiRequest<{ data: ThemePark }>(`/theme-parks/${parkId}`, {
    skipAuth: true,
  });
}

export type ThemeParkInput = {
  name: string;
  description: string;
  capacity: number;
  price: number;
  contact_email: string;
  contact_phone: string;
  images?: string[] | null;
};

export async function createThemePark(input: ThemeParkInput) {
  return apiRequest<DataEnvelope<ThemePark>>(`/theme-parks`, {
    method: "POST",
    body: input,
  });
}

export async function updateThemePark(
  parkId: number,
  input: Partial<ThemeParkInput>,
) {
  return apiRequest<DataEnvelope<ThemePark>>(`/theme-parks/${parkId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteThemePark(parkId: number) {
  return apiRequest<null>(`/theme-parks/${parkId}`, { method: "DELETE" });
}

// DESD-95: parks are soft-deleted. Restore un-archives the park and cascade-
// restores every trashed activity + schedule under it. 409 if the parent…
// (parks are top-level, so 409 only fires from race conditions).
export async function restoreThemePark(parkId: number) {
  return apiRequest<DataEnvelope<ThemePark>>(
    `/theme-parks/${parkId}/restore`,
    { method: "POST" },
  );
}

export async function listParkActivities(parkId: number, page = 1) {
  return apiRequest<Paginated<ParkActivity>>(
    `/theme-parks/${parkId}/activities?page=${page}`,
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
