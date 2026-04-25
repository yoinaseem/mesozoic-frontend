import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { ParkOpeningDay, ParkOpeningHour } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type ParkOpeningHourInput = {
  day: ParkOpeningDay;
  open_time: string;
  close_time: string;
};

export async function listParkOpeningHours(parkId: number, page = 1) {
  return apiRequest<Paginated<ParkOpeningHour>>(
    `/theme-parks/${parkId}/opening-hours?page=${page}`,
    { skipAuth: true },
  );
}

export async function createParkOpeningHour(
  parkId: number,
  input: ParkOpeningHourInput,
) {
  return apiRequest<DataEnvelope<ParkOpeningHour>>(
    `/theme-parks/${parkId}/opening-hours`,
    { method: "POST", body: input },
  );
}

export async function updateParkOpeningHour(
  parkId: number,
  openingHourId: number,
  input: Partial<ParkOpeningHourInput>,
) {
  return apiRequest<DataEnvelope<ParkOpeningHour>>(
    `/theme-parks/${parkId}/opening-hours/${openingHourId}`,
    { method: "PATCH", body: input },
  );
}

export async function deleteParkOpeningHour(
  parkId: number,
  openingHourId: number,
) {
  return apiRequest<null>(
    `/theme-parks/${parkId}/opening-hours/${openingHourId}`,
    { method: "DELETE" },
  );
}
