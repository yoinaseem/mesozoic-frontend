// Shared types for the customer booking flow. Shapes mirror the Laravel
// JsonResource responses documented in API_INTEGRATION.md and inferred from
// app/Http/Resources/*.php.

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
  room_type: RoomType;
  created_at: string;
  updated_at: string;
};

export type Hotel = {
  id: number;
  name: string;
  address: string;
  description: string;
  amenities: string[] | null;
  image: string | null;
  room_types?: RoomType[];
  created_at: string;
  updated_at: string;
};

export type Ferry = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  capacity: number;
  image: string | null;
  schedules?: FerrySchedule[];
  created_at: string;
  updated_at: string;
};

export type FerryScheduleStatus = "scheduled" | "completed" | "cancelled";

export type FerrySchedule = {
  id: number;
  ferry_id: number;
  travel_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  departure_port: string;
  arrival_port: string;
  status: FerryScheduleStatus;
  ferry?: Ferry;
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

export type BeachActivitySchedule = {
  id: number;
  beach_activity_id: number;
  activity_date: string;
  start_time: string;
  status: BeachActivityScheduleStatus;
  activity?: BeachActivity;
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

export type ParkActivityScheduleStatus = "scheduled" | "cancelled" | "completed";

export type ParkActivitySchedule = {
  id: number;
  park_activity_id: number;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  end_time_source: "explicit" | "derived" | null;
  status: ParkActivityScheduleStatus;
  notes: string | null;
  activity?: ParkActivity;
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

export type RoomSelection = {
  hotel: Hotel;
  roomType: RoomType;
  room: Room;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export type FerrySelection = {
  ferry: Ferry;
  schedule: FerrySchedule;
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
