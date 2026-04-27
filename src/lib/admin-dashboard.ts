import { listBeachActivities } from "@/lib/api/beach-activities";
import { listBeachBookings } from "@/lib/api/beach-bookings";
import { listFerries } from "@/lib/api/ferries";
import { listFerryBookings } from "@/lib/api/ferry-bookings";
import {
  getHotelAvailability,
  listHotels,
  type HotelAvailability,
} from "@/lib/api/hotels";
import { listParkActivityBookings } from "@/lib/api/park-activity-bookings";
import { listParkBookings } from "@/lib/api/park-bookings";
import { listParkHourOverrides } from "@/lib/api/park-hour-overrides";
import { listReservations } from "@/lib/api/reservations";
import { listMyHotels, listRoomBookings } from "@/lib/api/room-bookings";
import { listThemeParks } from "@/lib/api/theme-parks";
import { listUsers } from "@/lib/api/users";
import type { AuthUser, Paginated } from "@/types/auth";
import type {
  BeachActivity,
  BeachBooking,
  Ferry,
  FerryBooking,
  Hotel,
  ParkActivityBooking,
  ParkBooking,
  ParkHourOverride,
  Reservation,
  RoomBooking,
  ThemePark,
} from "@/types/booking";

export type AdminRole =
  | "superadmin"
  | "hotel-manager"
  | "park-manager"
  | "beach-manager"
  | "ferry-manager";

const ROLE_PRIORITY: AdminRole[] = [
  "superadmin",
  "hotel-manager",
  "park-manager",
  "beach-manager",
  "ferry-manager",
];

// Returns the first matching admin role on the user, or null if they hold
// none. Priority order picks superadmin over manager roles when a user
// (eventually) holds multiple — matches the per-resource access scope.
export function adminRoleOf(user: AuthUser | null): AdminRole | null {
  if (!user?.roles?.length) return null;
  for (const role of ROLE_PRIORITY) {
    if (user.roles.includes(role)) return role;
  }
  return null;
}

async function fetchAllPages<T>(
  fetcher: (page: number) => Promise<Paginated<T>>,
): Promise<T[]> {
  const first = await fetcher(1);
  if (!first.meta || first.meta.last_page <= 1) return first.data;
  const rest = await Promise.all(
    Array.from({ length: first.meta.last_page - 1 }, (_, i) => fetcher(i + 2)),
  );
  return [...first.data, ...rest.flatMap((r) => r.data)];
}

// /users behaves oddly per Chris (#2) — it's User::all() with no
// pagination, but the type still claims Paginated. Tolerate either shape.
async function fetchAllUsers(): Promise<AuthUser[]> {
  try {
    const res = (await listUsers(1)) as
      | Paginated<AuthUser>
      | AuthUser[]
      | { data: AuthUser[] };
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as { data: AuthUser[] }).data)) {
      const paged = res as Paginated<AuthUser>;
      if (!paged.meta || paged.meta.last_page <= 1) {
        return (res as { data: AuthUser[] }).data;
      }
      return fetchAllPages((page) => listUsers(page));
    }
    return [];
  } catch {
    return [];
  }
}

export type AdminSnapshot = {
  role: AdminRole;
  reservations: Reservation[];
  roomBookings: RoomBooking[];
  parkBookings: ParkBooking[];
  beachBookings: BeachBooking[];
  parkActivityBookings: ParkActivityBooking[];
  ferryBookings: FerryBooking[];
  hotels: Hotel[];
  themeParks: ThemePark[];
  ferries: Ferry[];
  beachActivities: BeachActivity[];
  users: AuthUser[];
  myHotels: { id: number; name: string }[];
  availabilityByHotelId: Record<number, HotelAvailability>;
  hourOverridesByParkId: Record<number, ParkHourOverride[]>;
};

const EMPTY_SNAPSHOT_FOR = (role: AdminRole): AdminSnapshot => ({
  role,
  reservations: [],
  roomBookings: [],
  parkBookings: [],
  beachBookings: [],
  parkActivityBookings: [],
  ferryBookings: [],
  hotels: [],
  themeParks: [],
  ferries: [],
  beachActivities: [],
  users: [],
  myHotels: [],
  availabilityByHotelId: {},
  hourOverridesByParkId: {},
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Fetch only the data the role actually consumes. The API auto-scopes
// indexes per role, so a hotel-manager calling /room-bookings already
// gets just their hotels — no extra filter needed here.
export async function fetchAdminSnapshot(
  role: AdminRole,
): Promise<AdminSnapshot> {
  const wantsRooms = role === "superadmin" || role === "hotel-manager";
  const wantsParks = role === "superadmin" || role === "park-manager";
  const wantsBeach = role === "superadmin" || role === "beach-manager";
  const wantsFerries = role === "superadmin" || role === "ferry-manager";
  const wantsUsers = role === "superadmin";
  const wantsMyHotels = role === "hotel-manager";

  const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
    p.catch(() => fallback);

  const [
    reservations,
    roomBookings,
    parkBookings,
    beachBookings,
    parkActivityBookings,
    ferryBookings,
    hotelsPage,
    themeParksRes,
    ferriesPage,
    beachActivitiesPage,
    users,
    myHotelsRes,
  ] = await Promise.all([
    wantsRooms
      ? safe(fetchAllPages((p) => listReservations({ page: p })), [])
      : Promise.resolve([] as Reservation[]),
    wantsRooms
      ? safe(fetchAllPages((p) => listRoomBookings({ page: p })), [])
      : Promise.resolve([] as RoomBooking[]),
    wantsParks
      ? safe(fetchAllPages((p) => listParkBookings({ page: p })), [])
      : Promise.resolve([] as ParkBooking[]),
    wantsBeach
      ? safe(fetchAllPages((p) => listBeachBookings({ page: p })), [])
      : Promise.resolve([] as BeachBooking[]),
    wantsParks
      ? safe(fetchAllPages((p) => listParkActivityBookings({ page: p })), [])
      : Promise.resolve([] as ParkActivityBooking[]),
    wantsFerries
      ? safe(fetchAllPages((p) => listFerryBookings({ page: p })), [])
      : Promise.resolve([] as FerryBooking[]),
    wantsRooms
      ? safe(fetchAllPages(listHotels), [])
      : Promise.resolve([] as Hotel[]),
    wantsParks
      ? safe(listThemeParks(), { data: [] as ThemePark[] })
      : Promise.resolve({ data: [] as ThemePark[] }),
    wantsFerries
      ? safe(fetchAllPages(listFerries), [])
      : Promise.resolve([] as Ferry[]),
    wantsBeach
      ? safe(fetchAllPages(listBeachActivities), [])
      : Promise.resolve([] as BeachActivity[]),
    wantsUsers ? fetchAllUsers() : Promise.resolve([] as AuthUser[]),
    wantsMyHotels
      ? safe(listMyHotels(), { data: [] as { id: number; name: string }[] })
      : Promise.resolve({ data: [] as { id: number; name: string }[] }),
  ]);

  const themeParks = themeParksRes.data;
  const myHotels = myHotelsRes.data;

  // Per-hotel "today" occupancy for the hotel-manager view.
  const availabilityByHotelId: Record<number, HotelAvailability> = {};
  if (role === "hotel-manager" && myHotels.length > 0) {
    const today = todayIso();
    const results = await Promise.all(
      myHotels.map(async (h) => {
        try {
          const r = await getHotelAvailability(h.id, today);
          return [h.id, r.data] as const;
        } catch {
          return [h.id, null] as const;
        }
      }),
    );
    for (const [id, value] of results) {
      if (value) availabilityByHotelId[id] = value;
    }
  }

  // Park hour-overrides per park for the closures widget.
  const hourOverridesByParkId: Record<number, ParkHourOverride[]> = {};
  if (role === "park-manager" || role === "superadmin") {
    const results = await Promise.all(
      themeParks.map(async (p) => {
        try {
          const overrides = await fetchAllPages((page) =>
            listParkHourOverrides(p.id, page),
          );
          return [p.id, overrides] as const;
        } catch {
          return [p.id, [] as ParkHourOverride[]] as const;
        }
      }),
    );
    for (const [id, value] of results) {
      hourOverridesByParkId[id] = value;
    }
  }

  return {
    ...EMPTY_SNAPSHOT_FOR(role),
    reservations,
    roomBookings,
    parkBookings,
    beachBookings,
    parkActivityBookings,
    ferryBookings,
    hotels: hotelsPage,
    themeParks,
    ferries: ferriesPage,
    beachActivities: beachActivitiesPage,
    users,
    myHotels,
    availabilityByHotelId,
    hourOverridesByParkId,
  };
}

// --- Money + date helpers ---

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function startOfTodayIso(): string {
  return todayIso();
}

function startOfWeekIso(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function startOfMonthIso(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  return d.toISOString().slice(0, 10);
}

// --- Aggregations: bookings + revenue across types ---

type AnyConfirmedBooking = {
  status: string;
  total_price: string;
  created_at: string;
};

function allBookings(snapshot: AdminSnapshot): AnyConfirmedBooking[] {
  return [
    ...snapshot.roomBookings,
    ...snapshot.parkBookings,
    ...snapshot.beachBookings,
    ...snapshot.parkActivityBookings,
    ...snapshot.ferryBookings,
  ];
}

function sumConfirmedSince(
  bookings: AnyConfirmedBooking[],
  sinceIso: string,
): number {
  return bookings.reduce((acc, b) => {
    if (b.status !== "confirmed") return acc;
    if (b.created_at.slice(0, 10) < sinceIso) return acc;
    return acc + Number(b.total_price);
  }, 0);
}

function countConfirmedSince(
  bookings: AnyConfirmedBooking[],
  sinceIso: string,
): number {
  return bookings.reduce((acc, b) => {
    if (b.status !== "confirmed") return acc;
    if (b.created_at.slice(0, 10) < sinceIso) return acc;
    return acc + 1;
  }, 0);
}

export type SuperadminAggregates = {
  revenueLifetime: number;
  revenueToday: number;
  revenueThisMonth: number;
  bookingsToday: number;
  bookingsThisWeek: number;
  bookingsThisMonth: number;
  activeReservations: number;
  cancellationRate: number; // 0..1
  cancelledLastWeek: number;
};

export function deriveSuperadminAggregates(
  snapshot: AdminSnapshot,
): SuperadminAggregates {
  const bookings = allBookings(snapshot);
  const today = startOfTodayIso();
  const week = startOfWeekIso();
  const month = startOfMonthIso();

  const totalConfirmed = bookings.filter((b) => b.status === "confirmed").length;
  const totalCancelled = bookings.filter((b) => b.status === "cancelled").length;
  const total = totalConfirmed + totalCancelled;
  const cancellationRate = total === 0 ? 0 : totalCancelled / total;

  // Cancelled bookings in last 7 days. Fallback signal for the "cancellation
  // requests" tile we couldn't surface (Chris #5: nothing tracked off-system).
  const lastWeekStart = new Date();
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekIso = lastWeekStart.toISOString().slice(0, 10);
  const cancelledLastWeek = bookings.reduce((acc, b) => {
    if (b.status !== "cancelled") return acc;
    if (b.created_at.slice(0, 10) < lastWeekIso) return acc;
    return acc + 1;
  }, 0);

  // Active reservations: at least one confirmed room with check_out_date >= today.
  const today_ = today;
  const activeReservations = snapshot.reservations.reduce((acc, r) => {
    const rooms = r.room_bookings ?? [];
    const isActive = rooms.some(
      (rb) => rb.status === "confirmed" && rb.check_out_date >= today_,
    );
    return isActive ? acc + 1 : acc;
  }, 0);

  return {
    revenueLifetime: bookings.reduce(
      (acc, b) =>
        b.status === "confirmed" ? acc + Number(b.total_price) : acc,
      0,
    ),
    revenueToday: sumConfirmedSince(bookings, today),
    revenueThisMonth: sumConfirmedSince(bookings, month),
    bookingsToday: countConfirmedSince(bookings, today),
    bookingsThisWeek: countConfirmedSince(bookings, week),
    bookingsThisMonth: countConfirmedSince(bookings, month),
    activeReservations,
    cancellationRate,
    cancelledLastWeek,
  };
}

// --- Charts ---

export type RevenueBucket = { month: string; label: string; spend: number };

export function deriveRevenueByMonth(snapshot: AdminSnapshot): RevenueBucket[] {
  const now = new Date();
  const buckets = new Map<string, number>();
  const labels = new Map<string, string>();
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short" });

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
    labels.set(key, fmt.format(d));
  }

  for (const b of allBookings(snapshot)) {
    if (b.status !== "confirmed") continue;
    const month = b.created_at.slice(0, 7);
    if (!buckets.has(month)) continue;
    buckets.set(month, (buckets.get(month) ?? 0) + Number(b.total_price));
  }

  return Array.from(buckets.entries()).map(([month, spend]) => ({
    month,
    label: labels.get(month) ?? month,
    spend,
  }));
}

export type MixSlice = {
  type: "Rooms" | "Park tickets" | "Beach activities" | "Park activities" | "Ferries";
  count: number;
  spend: number;
};

export function deriveBookingMix(snapshot: AdminSnapshot): MixSlice[] {
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
    slice("Rooms", snapshot.roomBookings),
    slice("Park tickets", snapshot.parkBookings),
    slice("Beach activities", snapshot.beachBookings),
    slice("Park activities", snapshot.parkActivityBookings),
    slice("Ferries", snapshot.ferryBookings),
  ];
}

// Confirmed room-bookings grouped by room type. Used by the donut chart in
// the hotel-manager view to surface which room types are pulling weight.
// Hotel-managers automatically scope to their assigned hotels via myHotels;
// superadmins see every hotel's room types.
export type RoomTypeMixEntry = {
  roomTypeId: number;
  name: string;
  hotelName: string;
  count: number;
  revenue: number;
};

export function deriveRoomTypeMix(
  snapshot: AdminSnapshot,
): RoomTypeMixEntry[] {
  // Same scope rule as deriveHotelStats: hotel-manager → only myHotels.
  const allowedHotelIds =
    snapshot.role === "hotel-manager"
      ? new Set(snapshot.myHotels.map((h) => h.id))
      : new Set(snapshot.hotels.map((h) => h.id));

  const hotelNameById = new Map<number, string>();
  for (const h of snapshot.hotels) hotelNameById.set(h.id, h.name);
  for (const h of snapshot.myHotels) {
    if (!hotelNameById.has(h.id)) hotelNameById.set(h.id, h.name);
  }

  const entries = new Map<number, RoomTypeMixEntry>();
  for (const rb of snapshot.roomBookings) {
    if (rb.status !== "confirmed") continue;
    if (allowedHotelIds.size > 0 && !allowedHotelIds.has(rb.hotel_id)) continue;
    const id = rb.room_type_id;
    const name = rb.room_type?.name ?? `Room type #${id}`;
    const hotelName =
      rb.hotel?.name ?? hotelNameById.get(rb.hotel_id) ?? `Hotel #${rb.hotel_id}`;
    const cur =
      entries.get(id) ?? { roomTypeId: id, name, hotelName, count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += Number(rb.total_price);
    entries.set(id, cur);
  }
  return Array.from(entries.values()).sort((a, b) => b.count - a.count);
}

// Top 5 hotels by confirmed-room revenue.
export type TopHotelEntry = { hotelId: number; name: string; revenue: number };

export function deriveTopHotelsByRevenue(
  snapshot: AdminSnapshot,
  limit = 5,
): TopHotelEntry[] {
  const totals = new Map<number, number>();
  for (const rb of snapshot.roomBookings) {
    if (rb.status !== "confirmed") continue;
    totals.set(rb.hotel_id, (totals.get(rb.hotel_id) ?? 0) + Number(rb.total_price));
  }
  const nameLookup = new Map(snapshot.hotels.map((h) => [h.id, h.name]));
  return Array.from(totals.entries())
    .map(([hotelId, revenue]) => ({
      hotelId,
      name: nameLookup.get(hotelId) ?? `Hotel #${hotelId}`,
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// Signups grouped by month (last 12). Customer-only — ignores staff users.
export type SignupBucket = { month: string; label: string; count: number };

export function deriveSignupsByMonth(snapshot: AdminSnapshot): SignupBucket[] {
  const now = new Date();
  const buckets = new Map<string, number>();
  const labels = new Map<string, string>();
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short" });

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
    labels.set(key, fmt.format(d));
  }

  for (const u of snapshot.users) {
    // Skip pure-staff accounts in the customer-growth chart — they don't
    // represent customer demand. Customers always carry the `customer` role.
    const isCustomer = u.roles?.includes("customer") ?? false;
    if (!isCustomer) continue;
    const month = (u.created_at ?? "").slice(0, 7);
    if (!buckets.has(month)) continue;
    buckets.set(month, (buckets.get(month) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([month, count]) => ({
    month,
    label: labels.get(month) ?? month,
    count,
  }));
}

// --- Recent activity feed (last N confirmed bookings across all types) ---

export type ActivityItem = {
  id: string;
  type: "room" | "park" | "beach" | "activity" | "ferry";
  title: string;
  subtitle: string;
  amount: number;
  createdAt: string;
};

export function deriveRecentActivity(
  snapshot: AdminSnapshot,
  limit = 20,
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const rb of snapshot.roomBookings) {
    items.push({
      id: `room-${rb.id}`,
      type: "room",
      title: rb.hotel?.name ?? `Hotel #${rb.hotel_id}`,
      subtitle: `${rb.check_in_date} → ${rb.check_out_date} · ${rb.guests} guest${rb.guests === 1 ? "" : "s"} · ${rb.status}`,
      amount: Number(rb.total_price),
      createdAt: rb.created_at,
    });
  }
  for (const b of snapshot.parkBookings) {
    items.push({
      id: `park-${b.id}`,
      type: "park",
      title: b.park?.name ?? `Park #${b.park_id}`,
      subtitle: `${b.date} · ${b.guests} guest${b.guests === 1 ? "" : "s"} · ${b.status}`,
      amount: Number(b.total_price),
      createdAt: b.created_at,
    });
  }
  for (const b of snapshot.beachBookings) {
    items.push({
      id: `beach-${b.id}`,
      type: "beach",
      title: b.schedule?.activity?.name ?? "Beach activity",
      subtitle: `${b.schedule?.activity_date ?? "—"} · ${b.guests} guest${b.guests === 1 ? "" : "s"} · ${b.status}`,
      amount: Number(b.total_price),
      createdAt: b.created_at,
    });
  }
  for (const b of snapshot.parkActivityBookings) {
    items.push({
      id: `activity-${b.id}`,
      type: "activity",
      title: b.schedule?.activity?.name ?? "Park activity",
      subtitle: `${b.schedule?.date ?? "—"} · ${b.guests} guest${b.guests === 1 ? "" : "s"} · ${b.status}`,
      amount: Number(b.total_price),
      createdAt: b.created_at,
    });
  }
  for (const b of snapshot.ferryBookings) {
    items.push({
      id: `ferry-${b.id}`,
      type: "ferry",
      title: b.schedule?.ferry?.name ?? "Ferry",
      subtitle: `${b.travel_date} · ${b.guests} passenger${b.guests === 1 ? "" : "s"} · ${b.status}`,
      amount: Number(b.total_price),
      createdAt: b.created_at,
    });
  }

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

// --- Hotel-manager view derivations ---

export type HotelStats = {
  hotelId: number;
  name: string;
  occupancyToday: { booked: number; total: number; free: number } | null;
  checkInsToday: RoomBooking[];
  checkOutsToday: RoomBooking[];
  activeReservations: number;
  revenue12mo: number;
};

export function deriveHotelStats(snapshot: AdminSnapshot): HotelStats[] {
  const today = todayIso();
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearAgoIso = yearAgo.toISOString().slice(0, 10);

  // Hotel-manager: scope to /auth/me/hotels.
  // Superadmin viewing the hotels tab: scope to all hotels.
  const sourceHotels =
    snapshot.role === "hotel-manager"
      ? snapshot.myHotels
      : snapshot.hotels.map((h) => ({ id: h.id, name: h.name }));

  return sourceHotels.map((h) => {
    const ownRooms = snapshot.roomBookings.filter((rb) => rb.hotel_id === h.id);
    const checkInsToday = ownRooms.filter(
      (rb) => rb.status === "confirmed" && rb.check_in_date === today,
    );
    const checkOutsToday = ownRooms.filter(
      (rb) => rb.status === "confirmed" && rb.check_out_date === today,
    );
    const revenue12mo = ownRooms.reduce(
      (acc, rb) =>
        rb.status === "confirmed" && rb.created_at.slice(0, 10) >= yearAgoIso
          ? acc + Number(rb.total_price)
          : acc,
      0,
    );
    const ownReservationIds = new Set(ownRooms.map((rb) => rb.reservation_id));
    const activeReservations = snapshot.reservations.reduce((acc, r) => {
      if (!ownReservationIds.has(r.id)) return acc;
      const isActive = (r.room_bookings ?? []).some(
        (rb) =>
          rb.hotel_id === h.id &&
          rb.status === "confirmed" &&
          rb.check_out_date >= today,
      );
      return isActive ? acc + 1 : acc;
    }, 0);
    const avail = snapshot.availabilityByHotelId[h.id];
    return {
      hotelId: h.id,
      name: h.name,
      occupancyToday: avail
        ? {
            booked: avail.totals.booked,
            total: avail.totals.total,
            free: avail.totals.free,
          }
        : null,
      checkInsToday,
      checkOutsToday,
      activeReservations,
      revenue12mo,
    };
  });
}

// --- Park-manager view derivations ---

export type ParkClosure = {
  parkId: number;
  parkName: string;
  date: string;
  note: string | null;
};

export function deriveUpcomingParkClosures(
  snapshot: AdminSnapshot,
): ParkClosure[] {
  const today = todayIso();
  const out: ParkClosure[] = [];
  const nameById = new Map(snapshot.themeParks.map((p) => [p.id, p.name]));
  for (const [parkIdRaw, overrides] of Object.entries(
    snapshot.hourOverridesByParkId,
  )) {
    const parkId = Number(parkIdRaw);
    for (const o of overrides) {
      if (!o.is_closed) continue;
      if (o.date < today) continue;
      out.push({
        parkId,
        parkName: nameById.get(parkId) ?? `Park #${parkId}`,
        date: o.date,
        note: o.note,
      });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export type TopActivityEntry = {
  activityId: number;
  name: string;
  count: number;
};

// Top park activities by booking count.
export function deriveTopParkActivities(
  snapshot: AdminSnapshot,
  limit = 5,
): TopActivityEntry[] {
  const counts = new Map<number, { count: number; name: string }>();
  for (const b of snapshot.parkActivityBookings) {
    if (b.status !== "confirmed") continue;
    const sched = b.schedule;
    if (!sched) continue;
    const id = sched.park_activity_id;
    const name = sched.activity?.name ?? `Activity #${id}`;
    const cur = counts.get(id) ?? { count: 0, name };
    cur.count++;
    counts.set(id, cur);
  }
  return Array.from(counts.entries())
    .map(([activityId, { count, name }]) => ({ activityId, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Top beach activities by booking count.
export function deriveTopBeachActivities(
  snapshot: AdminSnapshot,
  limit = 5,
): TopActivityEntry[] {
  const counts = new Map<number, { count: number; name: string }>();
  for (const b of snapshot.beachBookings) {
    if (b.status !== "confirmed") continue;
    const sched = b.schedule;
    if (!sched) continue;
    const id = sched.beach_activity_id;
    const name = sched.activity?.name ?? `Activity #${id}`;
    const cur = counts.get(id) ?? { count: 0, name };
    cur.count++;
    counts.set(id, cur);
  }
  return Array.from(counts.entries())
    .map(([activityId, { count, name }]) => ({ activityId, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Today + next 6 days, count of confirmed bookings on each date.
export type DateCount = { date: string; count: number };

export function deriveBookingsNext7Days<
  B extends { status: string },
>(bookings: B[], dateOf: (b: B) => string): DateCount[] {
  const today = new Date();
  const out: DateCount[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const count = bookings.reduce(
      (acc, b) => (b.status === "confirmed" && dateOf(b) === iso ? acc + 1 : acc),
      0,
    );
    out.push({ date: iso, count });
  }
  return out;
}

// --- Ferry-manager view derivations ---

// Capacity per (slot, date) for the next N days — total confirmed guests
// vs. the slot's vessel capacity.
export type CapacityCell = {
  scheduleId: number;
  ferryName: string;
  routeLabel: string;
  date: string;
  booked: number;
  capacity: number;
};

export function deriveFerryCapacityHeatmap(
  snapshot: AdminSnapshot,
  days = 7,
): CapacityCell[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const allSchedules = snapshot.ferries.flatMap((f) =>
    (f.schedules ?? []).map((s) => ({ ferry: f, schedule: s })),
  );

  const cells: CapacityCell[] = [];
  for (const { ferry, schedule } of allSchedules) {
    for (const date of dates) {
      const booked = snapshot.ferryBookings.reduce((acc, b) => {
        if (b.status !== "confirmed") return acc;
        if (b.ferry_schedule_id !== schedule.id) return acc;
        if (b.travel_date !== date) return acc;
        return acc + b.guests;
      }, 0);
      cells.push({
        scheduleId: schedule.id,
        ferryName: ferry.name,
        routeLabel: `${schedule.departure_port} → ${schedule.arrival_port}`,
        date,
        booked,
        capacity: ferry.ferry_type?.capacity ?? 0,
      });
    }
  }
  return cells;
}
