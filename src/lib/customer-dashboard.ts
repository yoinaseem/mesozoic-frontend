import { listBeachBookings } from "@/lib/api/beach-bookings";
import { listFerryBookings } from "@/lib/api/ferry-bookings";
import { listParkActivityBookings } from "@/lib/api/park-activity-bookings";
import { listParkBookings } from "@/lib/api/park-bookings";
import { listReservations } from "@/lib/api/reservations";
import type { Paginated } from "@/types/auth";
import type {
  BeachBooking,
  FerryBooking,
  ParkActivityBooking,
  ParkBooking,
  Reservation,
  RoomBooking,
} from "@/types/booking";

// Walk every page of a paginated index. Page 1 lands first to learn the
// total page count; the rest fetch in parallel. Customer indexes scope to
// the bearer's own data and cap at ~10/page, so even a heavy traveller
// resolves in a handful of round trips.
async function fetchAllPages<T>(
  fetcher: (page: number) => Promise<Paginated<T>>,
): Promise<T[]> {
  const first = await fetcher(1);
  if (first.meta.last_page <= 1) return first.data;
  const rest = await Promise.all(
    Array.from({ length: first.meta.last_page - 1 }, (_, i) => fetcher(i + 2)),
  );
  return [...first.data, ...rest.flatMap((r) => r.data)];
}

export type CustomerSnapshot = {
  reservations: Reservation[];
  parkBookings: ParkBooking[];
  beachBookings: BeachBooking[];
  parkActivityBookings: ParkActivityBooking[];
  ferryBookings: FerryBooking[];
};

export async function fetchCustomerSnapshot(): Promise<CustomerSnapshot> {
  const [
    reservations,
    parkBookings,
    beachBookings,
    parkActivityBookings,
    ferryBookings,
  ] = await Promise.all([
    fetchAllPages((page) => listReservations({ page })),
    fetchAllPages((page) => listParkBookings({ page })),
    fetchAllPages((page) => listBeachBookings({ page })),
    fetchAllPages((page) => listParkActivityBookings({ page })),
    fetchAllPages((page) => listFerryBookings({ page })),
  ]);

  return {
    reservations,
    parkBookings,
    beachBookings,
    parkActivityBookings,
    ferryBookings,
  };
}

// --- Per-reservation derivations ---

export type ReservationStatus = "active" | "partial" | "cancelled";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Per Chris (#12): status isn't on the resource. Derive it:
//  - active   = at least one confirmed room with check_out_date >= today
//  - cancelled = every room is cancelled (or there are no rooms)
//  - partial   = mixed (some confirmed, none upcoming OR everything in past)
export function deriveReservationStatus(
  reservation: Reservation,
): ReservationStatus {
  const rooms = reservation.room_bookings ?? [];
  if (rooms.length === 0) return "cancelled";
  const today = todayIso();
  if (
    rooms.some(
      (r) => r.status === "confirmed" && r.check_out_date >= today,
    )
  ) {
    return "active";
  }
  if (rooms.every((r) => r.status === "cancelled")) return "cancelled";
  return "partial";
}

export type DateRange = { checkIn: string; checkOut: string };

export function reservationDateRange(
  reservation: Reservation,
): DateRange | null {
  const confirmed = (reservation.room_bookings ?? []).filter(
    (r) => r.status === "confirmed",
  );
  if (confirmed.length === 0) return null;
  let checkIn = confirmed[0].check_in_date;
  let checkOut = confirmed[0].check_out_date;
  for (const r of confirmed) {
    if (r.check_in_date < checkIn) checkIn = r.check_in_date;
    if (r.check_out_date > checkOut) checkOut = r.check_out_date;
  }
  return { checkIn, checkOut };
}

export type BookingsSummary = {
  rooms: number;
  park: number;
  beach: number;
  activity: number;
  ferry: number;
};

export function computeBookingsSummary(
  reservation: Reservation,
  snapshot: CustomerSnapshot,
): BookingsSummary {
  const rid = reservation.id;
  const isOurs = (b: { reservation_id: number; status: string }) =>
    b.reservation_id === rid && b.status === "confirmed";

  return {
    rooms: (reservation.room_bookings ?? []).filter(
      (r) => r.status === "confirmed",
    ).length,
    park: snapshot.parkBookings.filter(isOurs).length,
    beach: snapshot.beachBookings.filter(isOurs).length,
    activity: snapshot.parkActivityBookings.filter(isOurs).length,
    ferry: snapshot.ferryBookings.filter(isOurs).length,
  };
}

function sumPrices(xs: { total_price: string; status: string }[]): number {
  return xs.reduce(
    (acc, x) => (x.status === "confirmed" ? acc + Number(x.total_price) : acc),
    0,
  );
}

export function computeReservationTotal(
  reservation: Reservation,
  snapshot: CustomerSnapshot,
): number {
  const rid = reservation.id;
  const ours = <T extends { reservation_id: number }>(arr: T[]) =>
    arr.filter((b) => b.reservation_id === rid);

  return (
    sumPrices(reservation.room_bookings ?? []) +
    sumPrices(ours(snapshot.parkBookings)) +
    sumPrices(ours(snapshot.beachBookings)) +
    sumPrices(ours(snapshot.parkActivityBookings)) +
    sumPrices(ours(snapshot.ferryBookings))
  );
}

// --- Aggregate stats for the dashboard ---

export type DashboardAggregates = {
  upcomingTripsCount: number;
  activeReservationsCount: number;
  lifetimeTripsCount: number;
  lifetimeSpend: number;
};

export function deriveDashboardAggregates(
  snapshot: CustomerSnapshot,
): DashboardAggregates {
  const today = todayIso();
  let upcomingTripsCount = 0;
  let activeReservationsCount = 0;
  let lifetimeTripsCount = 0;
  let lifetimeSpend = 0;

  for (const reservation of snapshot.reservations) {
    const status = deriveReservationStatus(reservation);
    if (status !== "cancelled") lifetimeTripsCount++;
    if (status === "active") activeReservationsCount++;

    const range = reservationDateRange(reservation);
    if (status === "active" && range && range.checkIn >= today) {
      upcomingTripsCount++;
    }

    lifetimeSpend += computeReservationTotal(reservation, snapshot);
  }

  return {
    upcomingTripsCount,
    activeReservationsCount,
    lifetimeTripsCount,
    lifetimeSpend,
  };
}

// --- Spend by month (last 12 months, including current) ---

export type SpendBucket = { month: string; label: string; spend: number };

export function computeSpendByMonth(snapshot: CustomerSnapshot): SpendBucket[] {
  const now = new Date();
  const buckets = new Map<string, number>();
  const labels = new Map<string, string>();
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short" });

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
    labels.set(key, monthLabel.format(d));
  }

  const credit = (rows: { created_at: string; total_price: string; status: string }[]) => {
    for (const row of rows) {
      if (row.status === "cancelled") continue;
      const month = row.created_at.slice(0, 7);
      if (!buckets.has(month)) continue;
      buckets.set(month, (buckets.get(month) ?? 0) + Number(row.total_price));
    }
  };

  for (const reservation of snapshot.reservations) {
    credit(reservation.room_bookings ?? []);
  }
  credit(snapshot.parkBookings);
  credit(snapshot.beachBookings);
  credit(snapshot.parkActivityBookings);
  credit(snapshot.ferryBookings);

  return Array.from(buckets.entries()).map(([month, spend]) => ({
    month,
    label: labels.get(month) ?? month,
    spend,
  }));
}

// --- Booking-type mix (counts + spend per type) ---

export type MixSlice = {
  type: "Rooms" | "Park tickets" | "Beach activities" | "Park activities" | "Ferries";
  count: number;
  spend: number;
};

export function computeBookingMix(snapshot: CustomerSnapshot): MixSlice[] {
  const allRooms: RoomBooking[] = snapshot.reservations.flatMap(
    (r) => r.room_bookings ?? [],
  );

  const slice = (
    type: MixSlice["type"],
    rows: { status: string; total_price: string }[],
  ): MixSlice => {
    const confirmed = rows.filter((r) => r.status === "confirmed");
    return {
      type,
      count: confirmed.length,
      spend: confirmed.reduce((acc, r) => acc + Number(r.total_price), 0),
    };
  };

  return [
    slice("Rooms", allRooms),
    slice("Park tickets", snapshot.parkBookings),
    slice("Beach activities", snapshot.beachBookings),
    slice("Park activities", snapshot.parkActivityBookings),
    slice("Ferries", snapshot.ferryBookings),
  ];
}

// --- Upcoming bookings (next-N flat list, soonest first) ---

export type UpcomingBookingItem = {
  id: string;
  type: "room" | "park" | "beach" | "activity" | "ferry";
  date: string;
  title: string;
  subtitle: string;
  guests: number;
  reservationId: number;
};

export function deriveUpcomingBookings(
  snapshot: CustomerSnapshot,
  limit = 8,
): UpcomingBookingItem[] {
  const today = todayIso();
  const items: UpcomingBookingItem[] = [];

  for (const reservation of snapshot.reservations) {
    for (const rb of reservation.room_bookings ?? []) {
      if (rb.status !== "confirmed" || rb.check_in_date < today) continue;
      items.push({
        id: `room-${rb.id}`,
        type: "room",
        date: rb.check_in_date,
        title: rb.hotel?.name ?? "Hotel stay",
        subtitle: `${rb.check_in_date} → ${rb.check_out_date} · ${rb.room_type?.name ?? "Room"}`,
        guests: rb.guests,
        reservationId: rb.reservation_id,
      });
    }
  }

  for (const b of snapshot.parkBookings) {
    if (b.status !== "confirmed" || b.date < today) continue;
    items.push({
      id: `park-${b.id}`,
      type: "park",
      date: b.date,
      title: b.park?.name ?? "Theme park",
      subtitle: `Day pass · ${b.date}`,
      guests: b.guests,
      reservationId: b.reservation_id,
    });
  }

  for (const b of snapshot.beachBookings) {
    const date = b.schedule?.activity_date ?? "";
    if (b.status !== "confirmed" || date < today) continue;
    items.push({
      id: `beach-${b.id}`,
      type: "beach",
      date,
      title: b.schedule?.activity?.name ?? "Beach activity",
      subtitle: `${date} · ${b.schedule?.start_time ?? "—"}`,
      guests: b.guests,
      reservationId: b.reservation_id,
    });
  }

  for (const b of snapshot.parkActivityBookings) {
    const date = b.schedule?.date ?? "";
    if (b.status !== "confirmed" || date < today) continue;
    items.push({
      id: `activity-${b.id}`,
      type: "activity",
      date,
      title: b.schedule?.activity?.name ?? "Park activity",
      subtitle: `${date} · ${b.schedule?.start_time ?? "—"}`,
      guests: b.guests,
      reservationId: b.reservation_id,
    });
  }

  for (const b of snapshot.ferryBookings) {
    if (b.status !== "confirmed" || b.travel_date < today) continue;
    items.push({
      id: `ferry-${b.id}`,
      type: "ferry",
      date: b.travel_date,
      title: b.schedule?.ferry?.name ?? "Ferry crossing",
      subtitle: `${b.travel_date} · ${b.schedule?.departure_time ?? "—"}${
        b.schedule?.departure_port
          ? ` · ${b.schedule.departure_port} → ${b.schedule.arrival_port}`
          : ""
      }`,
      guests: b.guests,
      reservationId: b.reservation_id,
    });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, limit);
}
