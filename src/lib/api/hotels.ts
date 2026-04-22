import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { Hotel, Room, RoomType } from "@/types/booking";

type ListEnvelope<T> = { data: T[] };

export async function listHotels() {
  return apiRequest<ListEnvelope<Hotel>>("/hotels", { skipAuth: true });
}

export async function getHotel(hotelId: number) {
  return apiRequest<{ data: Hotel }>(`/hotels/${hotelId}`, { skipAuth: true });
}

export async function listRoomTypes(hotelId: number) {
  return apiRequest<ListEnvelope<RoomType> | Paginated<RoomType>>(
    `/hotels/${hotelId}/room-types`,
    { skipAuth: true },
  );
}

export async function listRooms(hotelId: number, page = 1) {
  return apiRequest<Paginated<Room>>(
    `/hotels/${hotelId}/rooms?page=${page}`,
    { skipAuth: true },
  );
}
