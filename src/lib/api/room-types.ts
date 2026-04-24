import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { RoomType } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type RoomTypeInput = {
  name: string;
  description?: string | null;
  image?: string | null;
  capacity?: number | null;
  price?: number | null;
  amenities?: string[] | null;
};

export async function listRoomTypes(hotelId: number, page = 1) {
  return apiRequest<Paginated<RoomType>>(
    `/hotels/${hotelId}/room-types?page=${page}`,
    { skipAuth: true },
  );
}

export async function getRoomType(hotelId: number, roomTypeId: number) {
  return apiRequest<DataEnvelope<RoomType>>(
    `/hotels/${hotelId}/room-types/${roomTypeId}`,
    { skipAuth: true },
  );
}

export async function createRoomType(hotelId: number, input: RoomTypeInput) {
  return apiRequest<DataEnvelope<RoomType>>(
    `/hotels/${hotelId}/room-types`,
    { method: "POST", body: input },
  );
}

export async function updateRoomType(
  hotelId: number,
  roomTypeId: number,
  input: Partial<RoomTypeInput>,
) {
  return apiRequest<DataEnvelope<RoomType>>(
    `/hotels/${hotelId}/room-types/${roomTypeId}`,
    { method: "PATCH", body: input },
  );
}

export async function deleteRoomType(hotelId: number, roomTypeId: number) {
  return apiRequest<null>(`/hotels/${hotelId}/room-types/${roomTypeId}`, {
    method: "DELETE",
  });
}
