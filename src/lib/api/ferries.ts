import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { Ferry, FerrySchedule } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export async function listFerries(page = 1) {
  return apiRequest<Paginated<Ferry>>(`/ferries?page=${page}`, {
    skipAuth: true,
  });
}

export async function getFerry(ferryId: number) {
  return apiRequest<DataEnvelope<Ferry>>(`/ferries/${ferryId}`, {
    skipAuth: true,
  });
}

export type FerryInput = {
  ferry_type_id: number;
  name: string;
};

export async function createFerry(input: FerryInput) {
  return apiRequest<DataEnvelope<Ferry>>(`/ferries`, {
    method: "POST",
    body: input,
  });
}

export async function updateFerry(
  ferryId: number,
  input: Partial<FerryInput>,
) {
  return apiRequest<DataEnvelope<Ferry>>(`/ferries/${ferryId}`, {
    method: "PATCH",
    body: input,
  });
}

// DESD-100: archive + cascade with hybrid 409 / on_conflict=cascade.
export async function deleteFerry(
  ferryId: number,
  onConflict?: "reject" | "cascade",
) {
  return apiRequest<unknown>(`/ferries/${ferryId}`, {
    method: "DELETE",
    body: onConflict ? { on_conflict: onConflict } : undefined,
  });
}

export async function listFerrySchedules(ferryId: number, page = 1) {
  return apiRequest<Paginated<FerrySchedule>>(
    `/ferries/${ferryId}/schedules?page=${page}`,
    { skipAuth: true },
  );
}
