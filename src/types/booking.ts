// Shared types for the customer booking flow. Shapes mirror the Laravel
// JsonResource responses documented in API_INTEGRATION.md and inferred from
// app/Http/Resources/*.php.

import type { AuthUser } from "@/types/auth";

export type RoomType = {
  id: number;
  hotel_id: number;
  name: string;
  description: string | null;
  image: string | null;
  capacity: number | null;
  price: string | null;
  amenities: string[] | null;
  rooms_count?: number;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: number;
  hotel_id: number;
  room_type_id: number;
  room_no: string;
  room_type?: RoomType;
  created_at: string;
  updated_at: string;
};

export type Hotel = {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  amenities: string[] | null;
  image: string | null;
  room_types?: RoomType[];
  created_at: string;
  updated_at: string;
};

// DESD-100 ferry domain redesign:
// - FerryType is the catalogue (price + capacity live here)
// - Ferry is a vessel under a type (name + ferry_type_id only; inherits price/capacity)
// - FerrySchedule is a recurring slot on a vessel (no per-trip date, no status)
// All three soft-delete; DELETE is archive + hybrid 409 / on_conflict=cascade.

export type FerryType = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  capacity: number;
  price: number;
  ferries?: Ferry[];
  ferries_count?: number;
  created_at: string;
  updated_at: string;
};

export type Ferry = {
  id: number;
  ferry_type_id: number;
  name: string;
  ferry_type?: FerryType;
  schedules?: FerrySchedule[];
  schedules_count?: number;
  created_at: string;
  updated_at: string;
};

// DESD-100: schedules are fixed slots, not per-trip rows. No travel_date,
// no arrival_date, no per-trip status. The date lives on FerryBooking.
export type FerrySchedule = {
  id: number;
  ferry_id: number;
  departure_time: string;
  arrival_time: string;
  departure_port: string;
  arrival_port: string;
  ferry?: Ferry;
  created_at: string;
  updated_at: string;
};

export type FerryBookingStatus = "confirmed" | "cancelled";

export type FerryBooking = {
  id: number;
  reservation_id: number;
  ferry_schedule_id: number;
  travel_date: string;
  guests: number;
  status: FerryBookingStatus;
  price_per_guest: string;
  total_price: string;
  cancelled_at: string | null;
  reservation?: ReservationSummary;
  // Note: schedule may reference a soft-deleted slot (server uses
  // withTrashed() on booking eager-loads so cancellation history keeps
  // serialising the chain it ran against).
  schedule?: FerrySchedule;
  created_at: string;
  updated_at: string;
};

export type BeachActivity = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  capacity: number;
  duration: number;
  image: string | null;
  schedules?: BeachActivitySchedule[];
  schedules_count?: number;
  created_at: string;
  updated_at: string;
};

export type BeachActivityScheduleStatus = "pending" | "confirmed" | "cancelled";

// DESD-97 (Model B): `end_time` is now stored on the schedule row and is
// NOT NULL. Mutating an activity's `duration` no longer shifts existing
// schedules — `start_time`/`end_time` are canonical.
export type BeachActivitySchedule = {
  id: number;
  beach_activity_id: number;
  activity_date: string;
  start_time: string;
  end_time: string;
  status: BeachActivityScheduleStatus;
  activity?: BeachActivity;
  created_at: string;
  updated_at: string;
};

export type BeachBookingStatus = "confirmed" | "cancelled";

export type BeachBooking = {
  id: number;
  reservation_id: number;
  beach_activity_schedule_id: number;
  guests: number;
  status: BeachBookingStatus;
  price_per_guest: string;
  total_price: string;
  cancelled_at: string | null;
  reservation?: ReservationSummary;
  schedule?: BeachActivitySchedule;
  created_at: string;
  updated_at: string;
};

export type ThemePark = {
  id: number;
  name: string;
  images: string[] | null;
  description: string | null;
  capacity: number | null;
  price: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  opening_hours?: ParkOpeningHour[];
  activities?: ParkActivity[];
  created_at: string;
  updated_at: string;
};

export type ParkOpeningHour = {
  id: number;
  park_id: number;
  day: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
};

export type ParkActivity = {
  id: number;
  park_id: number;
  name: string;
  description: string | null;
  price: number | null;
  image: string | null;
  duration: number | null;
  max_capacity: number | null;
  is_all_day: boolean;
  schedules?: ParkActivitySchedule[];
  schedules_count?: number;
  created_at: string;
  updated_at: string;
};

export type ParkActivityScheduleStatus =
  | "scheduled"
  | "cancelled"
  | "completed";

// As of DESD-95: `start_time` and `end_time` are both NOT NULL on the
// schedule row. `end_time_source` is retained for one release for backward
// compatibility but is always `'explicit'` now.
export type ParkActivitySchedule = {
  id: number;
  park_activity_id: number;
  date: string;
  start_time: string;
  end_time: string;
  end_time_source: "explicit";
  status: ParkActivityScheduleStatus;
  notes: string | null;
  activity?: ParkActivity;
  created_at: string;
  updated_at: string;
};

// Minimal reservation shape returned when eager-loaded on booking resources.
// Full reservation documentation lives in API_INTEGRATION.md §10 and will be
// extended as the customer booking flow consumes more fields.
export type ReservationSummary = {
  id: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
};

export type ReservationStatus = "active" | "partial" | "cancelled";

export type ReservationBookingsSummary = {
  rooms: number;
  park: number;
  beach: number;
  activity: number;
  ferry: number;
};

// Full reservation shape returned by GET /reservations and GET /reservations/{id}.
// `status`, `total_amount`, and `bookings_summary` are pending backend work
// (see RESERVATIONS_BACKEND_BRIEF.md) — typed as optional so the UI degrades
// gracefully until they ship.
export type Reservation = {
  id: number;
  user_id: number;
  user?: AuthUser;
  room_bookings?: RoomBooking[];
  status?: ReservationStatus;
  total_amount?: string;
  bookings_summary?: ReservationBookingsSummary;
  created_at: string;
  updated_at: string;
};

export type RoomBookingStatus = "confirmed" | "cancelled";

export type RoomBooking = {
  id: number;
  reservation_id: number;
  hotel_id: number;
  room_type_id: number;
  room_id: number;
  guests: number;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  price_per_night: string;
  total_price: string;
  status: RoomBookingStatus;
  cancelled_at: string | null;
  reservation?: ReservationSummary;
  hotel?: Hotel;
  room_type?: RoomType;
  room?: Room;
  created_at: string;
  updated_at: string;
};

export type ParkActivityBookingStatus = "confirmed" | "cancelled";

export type ParkActivityBooking = {
  id: number;
  reservation_id: number;
  park_activity_schedule_id: number;
  guests: number;
  status: ParkActivityBookingStatus;
  price_per_guest: string;
  total_price: string;
  cancelled_at: string | null;
  reservation?: ReservationSummary;
  schedule?: ParkActivitySchedule;
  created_at: string;
  updated_at: string;
};

export type ParkBookingStatus = "confirmed" | "cancelled";

export type ParkBooking = {
  id: number;
  reservation_id: number;
  park_id: number;
  date: string;
  guests: number;
  status: ParkBookingStatus;
  price_per_guest: string;
  total_price: string;
  cancelled_at: string | null;
  reservation?: ReservationSummary;
  park?: ThemePark;
  created_at: string;
  updated_at: string;
};

export type ParkOpeningDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ParkHourOverride = {
  id: number;
  park_id: number;
  date: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type EffectiveHour = {
  date: string;
  status: "open" | "closed";
  source: "baseline" | "override";
  open_time: string | null;
  close_time: string | null;
  note: string | null;
};

// --- Cart selections (client-side only; submitted as booking payloads later) ---

// Room number is NOT carried in the cart — POST /room-bookings picks the
// lowest-numbered free room of room_type_id server-side. The customer-facing
// flow only collects hotel + type + window + guest count.
export type RoomSelection = {
  hotel: Hotel;
  roomType: RoomType;
  checkIn: string;
  checkOut: string;
  guests: number;
};

// `travelDate` is required per DESD-100 (slots are recurring; the date lives
// on the booking row, not the schedule). Must fall within the room's
// inclusive window — ferries use Reservation::ferrySeatPoolOn, which counts
// both arrival and departure days.
export type FerrySelection = {
  ferry: Ferry;
  schedule: FerrySchedule;
  travelDate: string;
  passengers: number;
};

export type ParkTicketSelection = {
  park: ThemePark;
  visitDate: string;
  guests: number;
};

export type ParkActivitySelection = {
  activity: ParkActivity;
  schedule: ParkActivitySchedule;
  guests: number;
};

export type BeachActivitySelection = {
  activity: BeachActivity;
  schedule: BeachActivitySchedule;
  guests: number;
};

export type BookingStep =
  | "room"
  | "ferry"
  | "park-ticket"
  | "park-activity"
  | "beach-activity";

export type BookingCart = {
  room: RoomSelection | null;
  ferry: FerrySelection | null;
  parkTicket: ParkTicketSelection | null;
  parkActivity: ParkActivitySelection | null;
  beachActivity: BeachActivitySelection | null;
};
