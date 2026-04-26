import { apiRequest } from "@/lib/api-client";
import type { Role } from "@/types/auth";

type DataEnvelope<T> = { data: T };

export type RoleInput = {
  name?: string;
  permissions?: string[];
};

// Returned as a flat resource collection (not paginated) — bounded set.
export async function listRoles() {
  return apiRequest<DataEnvelope<Role[]>>("/roles");
}

export async function getRole(id: number) {
  return apiRequest<DataEnvelope<Role>>(`/roles/${id}`);
}

export async function createRole(input: RoleInput) {
  return apiRequest<DataEnvelope<Role>>("/roles", {
    method: "POST",
    body: input,
  });
}

export async function updateRole(id: number, input: RoleInput) {
  return apiRequest<DataEnvelope<Role>>(`/roles/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteRole(id: number) {
  return apiRequest<null>(`/roles/${id}`, { method: "DELETE" });
}
