import { apiRequest } from "@/lib/api-client";
import type { AuthUser, Paginated } from "@/types/auth";

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type UpdateUserPayload = Partial<CreateUserPayload>;

export async function listUsers(page = 1) {
  return apiRequest<Paginated<AuthUser>>(`/users?page=${page}`);
}

export async function getUser(id: number) {
  return apiRequest<{ data: AuthUser }>(`/users/${id}`);
}

export async function createUser(payload: CreateUserPayload) {
  return apiRequest<{ data: AuthUser }>("/users", {
    method: "POST",
    body: payload,
  });
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
  return apiRequest<{ data: AuthUser }>(`/users/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteUser(id: number) {
  return apiRequest<void>(`/users/${id}`, {
    method: "DELETE",
  });
}

export type SyncUserRolesPayload = {
  roles: string[];
  // Three semantics:
  //   key absent       — pivot left untouched (or auto-cleared if hotel-manager
  //                      is being removed)
  //   key present []   — pivot cleared
  //   key present arr  — pivot replaced
  managed_hotels?: number[];
};

export async function syncUserRoles(id: number, payload: SyncUserRolesPayload) {
  return apiRequest<{ data: AuthUser }>(`/users/${id}/roles`, {
    method: "PUT",
    body: payload,
  });
}

export type SyncUserPermissionsPayload = {
  permissions: string[];
};

export async function syncUserPermissions(
  id: number,
  payload: SyncUserPermissionsPayload,
) {
  return apiRequest<{ data: AuthUser }>(`/users/${id}/permissions`, {
    method: "PUT",
    body: payload,
  });
}
