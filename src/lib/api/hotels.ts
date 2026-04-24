import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { Hotel } from "@/types/booking";

export type HotelAvailabilityRoom = {
  room_id: number;
  room_no: string;
  free: boolean;
};

export type HotelAvailability = {
  hotel_id: number;
  from: string;
  to: string;
  totals: { total: number; booked: number; free: number };
  room_types: {
    room_type_id: number;
    name: string;
    capacity: number | null;
    price: string;
    total: number;
    booked: number;
    free: number;
    rooms: HotelAvailabilityRoom[];
  }[];
};

export async function listHotels(page = 1) {
  return apiRequest<Paginated<Hotel>>(`/hotels?page=${page}`, {
    skipAuth: true,
  });
}

export async function getHotel(hotelId: number) {
  return apiRequest<{ data: Hotel }>(`/hotels/${hotelId}`, { skipAuth: true });
}

export async function deleteHotel(hotelId: number) {
  return apiRequest<null>(`/hotels/${hotelId}`, { method: "DELETE" });
}

export async function getHotelAvailability(
  hotelId: number,
  from?: string,
  to?: string,
) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  const path = `/hotels/${hotelId}/availability${query ? `?${query}` : ""}`;
  return apiRequest<{ data: HotelAvailability }>(path, { skipAuth: true });
}
