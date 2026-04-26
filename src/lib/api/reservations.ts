import { apiRequest } from "@/lib/api-client";
import type { Paginated } from "@/types/auth";
import type { Reservation, ReservationStatus } from "@/types/booking";

type DataEnvelope<T> = { data: T };

export type ListReservationsParams = {
  page?: number;
  status?: ReservationStatus;
  hotel_id?: number;
  customer?: string;
};

function buildQuery(params: ListReservationsParams): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.status) search.set("status", params.status);
  if (params.hotel_id != null) search.set("hotel_id", String(params.hotel_id));
  if (params.customer) search.set("customer", params.customer);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listReservations(params: ListReservationsParams = {}) {
  return apiRequest<Paginated<Reservation>>(`/reservations${buildQuery(params)}`);
}

export async function getReservation(id: number) {
  return apiRequest<DataEnvelope<Reservation>>(`/reservations/${id}`);
}
