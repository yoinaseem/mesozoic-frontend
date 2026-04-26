import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { FerryType } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type FerryTypeInput = {
  name: string;
  description?: string | null;
  image?: string | null;
  capacity: number;
  price: number;
};

export async function listFerryTypes(page = 1) {
  return apiRequest<Paginated<FerryType>>(`/ferry-types?page=${page}`, {
    skipAuth: true,
  });
}

export async function getFerryType(typeId: number) {
  return apiRequest<DataEnvelope<FerryType>>(`/ferry-types/${typeId}`, {
    skipAuth: true,
  });
}

export async function createFerryType(input: FerryTypeInput) {
  return apiRequest<DataEnvelope<FerryType>>(`/ferry-types`, {
    method: "POST",
    body: input,
  });
}

export async function updateFerryType(
  typeId: number,
  input: Partial<FerryTypeInput>,
) {
  return apiRequest<DataEnvelope<FerryType>>(`/ferry-types/${typeId}`, {
    method: "PATCH",
    body: input,
  });
}

// DESD-100: archive + cascade. Default 409 lists blocking bookings;
// `on_conflict=cascade` archives the type, every ferry under it, every slot
// under those ferries, and cancels all confirmed bookings.
export async function deleteFerryType(
  typeId: number,
  onConflict?: "reject" | "cascade",
) {
  return apiRequest<unknown>(`/ferry-types/${typeId}`, {
    method: "DELETE",
    body: onConflict ? { on_conflict: onConflict } : undefined,
  });
}
