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
  return apiRequest<AuthUser>(`/users/${id}`);
}

export async function createUser(payload: CreateUserPayload) {
  return apiRequest<AuthUser>("/users", {
    method: "POST",
    body: payload,
  });
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
  return apiRequest<AuthUser>(`/users/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteUser(id: number) {
  return apiRequest<void>(`/users/${id}`, {
    method: "DELETE",
  });
}
