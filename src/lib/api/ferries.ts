import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { Ferry, FerrySchedule } from "@/types/booking";

export async function listFerries() {
  return apiRequest<{ data: Ferry[] }>("/ferries", { skipAuth: true });
}

export async function getFerry(ferryId: number) {
  return apiRequest<{ data: Ferry }>(`/ferries/${ferryId}`, { skipAuth: true });
}

export async function listFerrySchedules(ferryId: number, page = 1) {
  return apiRequest<Paginated<FerrySchedule>>(
    `/ferries/${ferryId}/schedules?page=${page}`,
    { skipAuth: true },
  );
}
