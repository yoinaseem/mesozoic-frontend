import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { ParkHourOverride } from "@/types/booking";

type DataEnvelope<T> = { data: T };

// Per API §9: both times set => "open with explicit hours". Both null =>
// "closed that day". Partial (one set, one null) => 422.
export type ParkHourOverrideInput = {
  date: string;
  open_time: string | null;
  close_time: string | null;
  note?: string | null;
};

export async function listParkHourOverrides(parkId: number, page = 1) {
  return apiRequest<Paginated<ParkHourOverride>>(
    `/theme-parks/${parkId}/hour-overrides?page=${page}`,
    { skipAuth: true },
  );
}

export async function createParkHourOverride(
  parkId: number,
  input: ParkHourOverrideInput,
) {
  return apiRequest<DataEnvelope<ParkHourOverride>>(
    `/theme-parks/${parkId}/hour-overrides`,
    { method: "POST", body: input },
  );
}

export async function updateParkHourOverride(
  parkId: number,
  overrideId: number,
  input: Partial<ParkHourOverrideInput>,
) {
  return apiRequest<DataEnvelope<ParkHourOverride>>(
    `/theme-parks/${parkId}/hour-overrides/${overrideId}`,
    { method: "PATCH", body: input },
  );
}

export async function deleteParkHourOverride(
  parkId: number,
  overrideId: number,
) {
  return apiRequest<null>(
    `/theme-parks/${parkId}/hour-overrides/${overrideId}`,
    { method: "DELETE" },
  );
}
