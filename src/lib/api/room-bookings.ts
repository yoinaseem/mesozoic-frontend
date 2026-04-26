import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { RoomBooking, RoomBookingStatus } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type ListRoomBookingsParams = {
  page?: number;
  status?: RoomBookingStatus;
  hotel_id?: number;
  room_type_id?: number;
  check_in_from?: string;
  check_in_to?: string;
  reservation_id?: number;
};

export async function listRoomBookings(params: ListRoomBookingsParams = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  const path = `/room-bookings${query ? `?${query}` : ""}`;
  return apiRequest<Paginated<RoomBooking>>(path);
}

export type MyHotel = { id: number; name: string };

export async function listMyHotels() {
  return apiRequest<{ data: MyHotel[] }>("/auth/me/hotels");
}

// POST /room-bookings — server picks the room (lowest free of room_type_id),
// so payload omits hotel_id/room_id. Reservation auto-creates when omitted.
export type CreateRoomBookingPayload = {
  reservation_id?: number;
  room_type_id: number;
  check_in_date: string;
  check_out_date: string;
  guests: number;
};

export async function createRoomBooking(payload: CreateRoomBookingPayload) {
  return apiRequest<DataEnvelope<RoomBooking>>("/room-bookings", {
    method: "POST",
    body: payload,
  });
}

// Soft-cancel: backend flips status to "cancelled" and sets cancelled_at
// server-side. 204 on success. Re-fetch the list to see the updated row.
export async function cancelRoomBooking(bookingId: number) {
  return apiRequest<null>(`/room-bookings/${bookingId}`, { method: "DELETE" });
}
