import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { Room } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type RoomInput = {
  room_no: string;
  room_type_id: number;
};

export async function listRooms(hotelId: number, page = 1) {
  return apiRequest<Paginated<Room>>(`/hotels/${hotelId}/rooms?page=${page}`, {
    skipAuth: true,
  });
}

export async function getRoom(hotelId: number, roomId: number) {
  return apiRequest<DataEnvelope<Room>>(`/hotels/${hotelId}/rooms/${roomId}`, {
    skipAuth: true,
  });
}

export async function createRoom(hotelId: number, input: RoomInput) {
  return apiRequest<DataEnvelope<Room>>(`/hotels/${hotelId}/rooms`, {
    method: "POST",
    body: input,
  });
}

export async function updateRoom(
  hotelId: number,
  roomId: number,
  input: Partial<RoomInput>,
) {
  return apiRequest<DataEnvelope<Room>>(`/hotels/${hotelId}/rooms/${roomId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteRoom(hotelId: number, roomId: number) {
  return apiRequest<null>(`/hotels/${hotelId}/rooms/${roomId}`, {
    method: "DELETE",
  });
}
