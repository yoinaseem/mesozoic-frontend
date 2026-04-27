"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ApiError,
  getValidationErrors,
} from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import {
  clearCart as clearCartStorage,
  hasStagedItems as hasStagedItemsHelper,
  loadCart,
  saveCart,
} from "@/lib/cart-storage";
import {
  createBeachBooking,
  listBeachBookings,
} from "@/lib/api/beach-bookings";
import {
  createFerryBooking,
  listFerryBookings,
} from "@/lib/api/ferry-bookings";
import {
  createParkActivityBooking,
  listParkActivityBookings,
} from "@/lib/api/park-activity-bookings";
import {
  createParkBooking,
  listParkBookings,
} from "@/lib/api/park-bookings";
import { createRoomBooking } from "@/lib/api/room-bookings";
import type { FieldErrors } from "@/types/auth";
import type {
  BeachActivitySelection,
  BeachBooking,
  BookingCart,
  BookingStep,
  FerryBooking,
  FerrySelection,
  ParkActivityBooking,
  ParkActivitySelection,
  ParkBooking,
  ParkTicketSelection,
  Reservation,
  RoomBooking,
  RoomSelection,
} from "@/types/booking";

// Submit pipeline step identifiers (separate from booking-flow step ids).
// Room/parkTicket/beach/ferry run in dependency order; parkActivity is
// last because the API requires the day-pass row to already exist.
export type SubmitStep =
  | "room"
  | "park-ticket"
  | "park-activity"
  | "beach-activity"
  | "ferry";

export type SubmitStepError = {
  step: SubmitStep;
  message: string;
  fieldErrors: FieldErrors;
};

export type SubmitResult = {
  reservationId: number | null;
  rooms: RoomBooking[];
  parkBookings: ParkBooking[];
  parkActivityBookings: ParkActivityBooking[];
  beachBookings: BeachBooking[];
  ferryBookings: FerryBooking[];
  errors: SubmitStepError[];
};

// Existing tickets on the reservation we're attaching to. We carry the
// full booking arrays (so the summary can render them and the activity
// step can derive park/date context from a held day-pass) AND the derived
// conflict sets used by the duplicate pre-check. Conflict sets are keyed
// in the form the schedule picker probes directly so lookups stay O(1).
export type ExistingReservationBookings = {
  parkBookings: ParkBooking[];
  beachBookings: BeachBooking[];
  parkActivityBookings: ParkActivityBooking[];
  ferryBookings: FerryBooking[];
  parkDates: Set<string>;
  beachScheduleIds: Set<number>;
  parkActivityScheduleIds: Set<number>;
  ferryScheduleDates: Set<string>;
};

const EMPTY_EXISTING: ExistingReservationBookings = {
  parkBookings: [],
  beachBookings: [],
  parkActivityBookings: [],
  ferryBookings: [],
  parkDates: new Set(),
  beachScheduleIds: new Set(),
  parkActivityScheduleIds: new Set(),
  ferryScheduleDates: new Set(),
};

// The half-open trip window. `checkIn` is the earliest of any room's
// check-in; `checkOut` is the latest of any room's check-out. Ticket
// modules use this for client-side date-window filtering. Backend
// `seatPoolOn` does the per-date authoritative check, so a trip with
// gaps will surface 422s rather than silently book.
export type TripWindow = {
  checkIn: string;
  checkOut: string;
};

const STEP_ORDER: BookingStep[] = [
  "room",
  "ferry",
  "park-ticket",
  "park-activity",
  "beach-activity",
];

type BookingCartContextValue = {
  cart: BookingCart;
  reservationId: number | null;
  attachToReservationId: number | null;
  setAttachToReservationId: (id: number | null) => void;
  // True when the cart is anchored on a reservation that already has at
  // least one confirmed room. New rooms added in this session still POST.
  roomAlreadyExists: boolean;
  startFromExistingReservation: (
    reservation: Reservation,
    anchorRoomBooking: RoomBooking,
  ) => void;
  // Multi-room cart actions.
  addRoom: (selection: RoomSelection) => void;
  removeRoom: (index: number) => void;
  clearRooms: () => void;
  // Convenience getters derived from cart.rooms.
  primaryRoom: RoomSelection | null;
  tripWindow: TripWindow | null;
  // Ferries — multi.
  addFerry: (selection: FerrySelection) => void;
  removeFerry: (index: number) => void;
  clearFerries: () => void;
  // Park tickets — multi. Removing a ticket cascades to drop any park
  // activities tied to its (park_id, visit_date) combo.
  addParkTicket: (selection: ParkTicketSelection) => void;
  removeParkTicket: (index: number) => void;
  clearParkTickets: () => void;
  // Park activities — multi.
  addParkActivity: (selection: ParkActivitySelection) => void;
  removeParkActivity: (index: number) => void;
  clearParkActivities: () => void;
  // Beach activities — multi.
  addBeachActivity: (selection: BeachActivitySelection) => void;
  removeBeachActivity: (index: number) => void;
  clearBeachActivities: () => void;
  isStepUnlocked: (step: BookingStep) => boolean;
  stepLockReason: (step: BookingStep) => string | null;
  hasAnyAddOn: boolean;
  canBook: boolean;
  submitting: boolean;
  submitCart: () => Promise<SubmitResult>;
  existingBookings: ExistingReservationBookings;
  // Reconciles cart state with what just hit the API. Call this after
  // every submitCart() so a retry doesn't re-POST items that already
  // succeeded — posted rooms get tagged with their existingId, successful
  // ticket slots clear, attachToReservationId pins to the new trip, and
  // existingBookings refetches so duplicate-pre-checks see the new items.
  consumeSubmitResult: (result: SubmitResult) => void;
  // True when the cart has anything the customer would care about saving
  // — staged tickets or freshly-added (non-existing) rooms. Drives the
  // "Proceed to checkout" CTA visibility and the dashboard widget.
  hasStagedItems: boolean;
  // True once the storage hydration effect has completed for the current
  // user. Pages downstream (e.g. /book/checkout's empty-cart redirect)
  // should wait for this before reading hasStagedItems — otherwise they
  // race the load and bounce the customer with a still-empty cart.
  isHydrated: boolean;
  // Active step + nav helpers — lifted into context so each step can
  // render its own Previous/Next buttons without prop-drilling.
  activeStep: BookingStep;
  setActiveStep: (step: BookingStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  hasPreviousStep: boolean;
  hasNextStep: boolean;
  // Step commit registry — each step that has a draftable form registers
  // a tryCommit() callback at mount; tab-click navigation runs the active
  // step's committer first so partial input doesn't get silently dropped
  // when the customer switches tabs without pressing Next. The committer
  // returns false to block navigation (touched-but-invalid form).
  registerStepCommitter: (
    step: BookingStep,
    fn: (() => boolean) | null,
  ) => void;
  tryCommitActiveStep: () => boolean;
  reset: () => void;
};

const EMPTY_CART: BookingCart = {
  rooms: [],
  ferries: [],
  parkTickets: [],
  parkActivities: [],
  beachActivities: [],
};

const BookingCartContext = createContext<BookingCartContextValue | null>(null);

function toStepError(step: SubmitStep, error: unknown): SubmitStepError {
  if (error instanceof ApiError) {
    return {
      step,
      message: error.message,
      fieldErrors: getValidationErrors(error),
    };
  }
  return {
    step,
    message: error instanceof Error ? error.message : "Request failed.",
    fieldErrors: {},
  };
}

function computeTripWindow(rooms: RoomSelection[]): TripWindow | null {
  if (rooms.length === 0) return null;
  let checkIn = rooms[0].checkIn;
  let checkOut = rooms[0].checkOut;
  for (const room of rooms) {
    if (room.checkIn < checkIn) checkIn = room.checkIn;
    if (room.checkOut > checkOut) checkOut = room.checkOut;
  }
  return { checkIn, checkOut };
}

export function BookingCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [cart, setCart] = useState<BookingCart>(EMPTY_CART);
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [attachToReservationId, setAttachToReservationId] = useState<
    number | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [roomAlreadyExists, setRoomAlreadyExists] = useState(false);
  const [existingBookings, setExistingBookings] =
    useState<ExistingReservationBookings>(EMPTY_EXISTING);
  // Only persist after the initial hydration completes — otherwise the
  // first render would overwrite the saved cart with EMPTY_CART before
  // we have a chance to load it. State (not ref) so the load + flip
  // commit together: the persistence effect won't see isHydrated=true
  // while cart is still EMPTY_CART, which is what the previous ref-based
  // version raced on.
  const [isHydrated, setIsHydrated] = useState(false);
  // Bumping this forces the existingBookings useEffect to re-run even
  // when attachToReservationId hasn't changed — used after a successful
  // submit so the just-confirmed items show up in conflict pre-checks.
  const [existingBookingsRefreshKey, setExistingBookingsRefreshKey] =
    useState(0);
  const [activeStep, setActiveStep] = useState<BookingStep>("room");

  // Step commit registry. Steps push their tryCommit() callback through
  // a stable wrapper that delegates to a ref — this lets the callback
  // close over fresh form state without us having to re-register on
  // every render. Each step writes to its own slot; the active step's
  // entry is consulted on tab navigation.
  const stepCommittersRef = useRef<
    Partial<Record<BookingStep, () => boolean>>
  >({});

  const registerStepCommitter = useCallback(
    (step: BookingStep, fn: (() => boolean) | null) => {
      if (fn === null) {
        delete stepCommittersRef.current[step];
      } else {
        stepCommittersRef.current[step] = fn;
      }
    },
    [],
  );

  // Hydrate from storage when the user resolves. Re-runs when the user
  // changes (logout/login as a different account).
  useEffect(() => {
    if (userId === null) {
      setIsHydrated(false);
      return;
    }
    const stored = loadCart(userId);
    if (stored) {
      setCart(stored.cart);
      setAttachToReservationId(stored.attachToReservationId);
      setRoomAlreadyExists(stored.roomAlreadyExists);
      setActiveStep(stored.activeStep);
    }
    setIsHydrated(true);
  }, [userId]);

  // Persist on every cart-relevant state change. Skipped until the
  // hydration effect's state updates have landed (isHydrated flipped
  // *and* cart/etc. populated in the same commit) so we don't blow away
  // saved state on first render.
  useEffect(() => {
    if (userId === null || !isHydrated) return;
    saveCart(userId, {
      cart,
      attachToReservationId,
      roomAlreadyExists,
      activeStep,
    });
  }, [
    userId,
    isHydrated,
    cart,
    attachToReservationId,
    roomAlreadyExists,
    activeStep,
  ]);

  // Whenever the customer chooses to attach to an existing reservation,
  // fetch its current confirmed tickets so step pickers can grey out
  // already-booked slots. Confirmed-only — cancelled rows don't conflict
  // (the API explicitly allows rebooking after a staff cancel).
  useEffect(() => {
    if (attachToReservationId === null) {
      setExistingBookings(EMPTY_EXISTING);
      return;
    }

    const rid = attachToReservationId;
    let cancelled = false;

    (async () => {
      try {
        const [parks, beach, parkActs, ferry] = await Promise.all([
          listParkBookings({ reservation_id: rid, status: "confirmed" }),
          listBeachBookings({ reservation_id: rid, status: "confirmed" }),
          listParkActivityBookings({
            reservation_id: rid,
            status: "confirmed",
          }),
          listFerryBookings({ reservation_id: rid, status: "confirmed" }),
        ]);
        if (cancelled) return;

        setExistingBookings({
          parkBookings: parks.data,
          beachBookings: beach.data,
          parkActivityBookings: parkActs.data,
          ferryBookings: ferry.data,
          parkDates: new Set(
            parks.data.map((b) => `${b.park_id}|${b.date}`),
          ),
          beachScheduleIds: new Set(
            beach.data.map((b) => b.beach_activity_schedule_id),
          ),
          parkActivityScheduleIds: new Set(
            parkActs.data.map((b) => b.park_activity_schedule_id),
          ),
          ferryScheduleDates: new Set(
            ferry.data.map(
              (b) => `${b.ferry_schedule_id}|${b.travel_date}`,
            ),
          ),
        });
      } catch {
        if (cancelled) return;
        setExistingBookings(EMPTY_EXISTING);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attachToReservationId, existingBookingsRefreshKey]);

  // Append a room. Anchored mode keeps `roomAlreadyExists` true (added
  // rooms are still NEW for the API) — only an explicit clearRooms drops
  // the anchor. The reservation_id, if any, persists across additions.
  const addRoom = useCallback((selection: RoomSelection) => {
    setCart((prev) => ({ ...prev, rooms: [...prev.rooms, selection] }));
  }, []);

  const removeRoom = useCallback((index: number) => {
    setCart((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index),
    }));
  }, []);

  // Drop every room and (consequently) every dependent ticket — same
  // semantics as the old setRoom(null). Also drops anchor + reservation
  // state because there's no longer a trip to attach things to.
  const clearRooms = useCallback(() => {
    setCart(EMPTY_CART);
    setReservationId(null);
    setAttachToReservationId(null);
    setRoomAlreadyExists(false);
  }, []);

  const addFerry = useCallback((selection: FerrySelection) => {
    setCart((prev) => ({ ...prev, ferries: [...prev.ferries, selection] }));
  }, []);

  const removeFerry = useCallback((index: number) => {
    setCart((prev) => ({
      ...prev,
      ferries: prev.ferries.filter((_, i) => i !== index),
    }));
  }, []);

  const clearFerries = useCallback(() => {
    setCart((prev) => ({ ...prev, ferries: [] }));
  }, []);

  const addParkTicket = useCallback((selection: ParkTicketSelection) => {
    setCart((prev) => ({
      ...prev,
      parkTickets: [...prev.parkTickets, selection],
    }));
  }, []);

  // Removing a park ticket cascades to any park activities tied to its
  // (park_id, date) combo: those activities require a same-day day-pass
  // (cart-side or already-on-trip) and would 422 on submit otherwise.
  // Activities still backed by an existingBookings day-pass are kept —
  // those are independent of cart state.
  const removeParkTicket = useCallback(
    (index: number) => {
      setCart((prev) => {
        const removed = prev.parkTickets[index];
        if (!removed) return prev;
        const remainingTickets = prev.parkTickets.filter(
          (_, i) => i !== index,
        );
        const stillCoveredByCart = (parkId: number, date: string) =>
          remainingTickets.some(
            (t) => t.park.id === parkId && t.visitDate === date,
          );
        const stillCoveredByExisting = (parkId: number, date: string) =>
          existingBookings.parkDates.has(`${parkId}|${date}`);
        const remainingActivities = prev.parkActivities.filter((a) => {
          const date = a.schedule?.date ?? a.date ?? null;
          if (date === null) return true;
          const parkId = a.activity.park_id;
          if (parkId !== removed.park.id || date !== removed.visitDate) {
            return true;
          }
          return (
            stillCoveredByCart(parkId, date) ||
            stillCoveredByExisting(parkId, date)
          );
        });
        return {
          ...prev,
          parkTickets: remainingTickets,
          parkActivities: remainingActivities,
        };
      });
    },
    [existingBookings.parkDates],
  );

  const clearParkTickets = useCallback(() => {
    setCart((prev) => {
      // Same cascade as removeParkTicket but for every ticket at once.
      const stillCoveredByExisting = (parkId: number, date: string) =>
        existingBookings.parkDates.has(`${parkId}|${date}`);
      const remainingActivities = prev.parkActivities.filter((a) => {
        const date = a.schedule?.date ?? a.date ?? null;
        if (date === null) return true;
        return stillCoveredByExisting(a.activity.park_id, date);
      });
      return {
        ...prev,
        parkTickets: [],
        parkActivities: remainingActivities,
      };
    });
  }, [existingBookings.parkDates]);

  const addParkActivity = useCallback((selection: ParkActivitySelection) => {
    setCart((prev) => ({
      ...prev,
      parkActivities: [...prev.parkActivities, selection],
    }));
  }, []);

  const removeParkActivity = useCallback((index: number) => {
    setCart((prev) => ({
      ...prev,
      parkActivities: prev.parkActivities.filter((_, i) => i !== index),
    }));
  }, []);

  const clearParkActivities = useCallback(() => {
    setCart((prev) => ({ ...prev, parkActivities: [] }));
  }, []);

  const addBeachActivity = useCallback(
    (selection: BeachActivitySelection) => {
      setCart((prev) => ({
        ...prev,
        beachActivities: [...prev.beachActivities, selection],
      }));
    },
    [],
  );

  const removeBeachActivity = useCallback((index: number) => {
    setCart((prev) => ({
      ...prev,
      beachActivities: prev.beachActivities.filter((_, i) => i !== index),
    }));
  }, []);

  const clearBeachActivities = useCallback(() => {
    setCart((prev) => ({ ...prev, beachActivities: [] }));
  }, []);

  const reset = useCallback(() => {
    setCart(EMPTY_CART);
    setReservationId(null);
    setAttachToReservationId(null);
    setRoomAlreadyExists(false);
    setActiveStep("room");
    if (userId !== null) clearCartStorage(userId);
  }, [userId]);

  const consumeSubmitResult = useCallback((result: SubmitResult) => {
    if (result.reservationId === null) return;

    setCart((prev) => {
      const next = { ...prev };

      // Tag posted rooms with their existingId so submitCart skips them
      // next time. Match by the (room_type_id, check_in_date,
      // check_out_date) tuple — there's no direct id link from selection
      // to result, but this combo is unique-enough for cart entries the
      // user composed in this session.
      if (result.rooms.length > 0) {
        next.rooms = prev.rooms.map((room) => {
          if (room.existingId !== undefined) return room;
          const match = result.rooms.find(
            (rb) =>
              rb.room_type_id === room.roomType.id &&
              rb.check_in_date === room.checkIn &&
              rb.check_out_date === room.checkOut,
          );
          return match ? { ...room, existingId: match.id } : room;
        });
      }

      // Drop staged tickets/activities that successfully posted so a retry
      // doesn't re-POST them. The just-posted rows show up in
      // existingBookings after the refresh below, so the customer still
      // sees them in the summary. Match each cart entry against the
      // result list by (park_id, date) for tickets and (schedule_id) /
      // (activity_id, date) for activities — same identity tuples the
      // submit code uses, so a partial success leaves only the items that
      // didn't land yet.
      if (result.parkBookings.length > 0) {
        next.parkTickets = prev.parkTickets.filter((t) => {
          return !result.parkBookings.some(
            (pb) =>
              pb.park_id === t.park.id &&
              pb.date === t.visitDate &&
              pb.status === "confirmed",
          );
        });
      }
      if (result.parkActivityBookings.length > 0) {
        next.parkActivities = prev.parkActivities.filter((a) => {
          return !result.parkActivityBookings.some((pab) => {
            if (pab.status !== "confirmed") return false;
            if (a.schedule) {
              return pab.park_activity_schedule_id === a.schedule.id;
            }
            // All-day flow: server materialises a schedule on POST, match
            // by date + activity from the embedded schedule.
            const date = pab.schedule?.date;
            const activityId = pab.schedule?.activity?.id;
            return (
              date === a.date &&
              activityId !== undefined &&
              activityId === a.activity.id
            );
          });
        });
      }
      if (result.beachBookings.length > 0) {
        next.beachActivities = prev.beachActivities.filter((b) => {
          return !result.beachBookings.some(
            (bb) =>
              bb.beach_activity_schedule_id === b.schedule.id &&
              bb.status === "confirmed",
          );
        });
      }
      if (result.ferryBookings.length > 0) {
        next.ferries = prev.ferries.filter((f) => {
          return !result.ferryBookings.some(
            (fb) =>
              fb.ferry_schedule_id === f.schedule.id &&
              fb.travel_date === f.travelDate &&
              fb.status === "confirmed",
          );
        });
      }

      return next;
    });

    // Pin the reservation id for any subsequent submits — without this,
    // a fresh-trip submit would create the trip on attempt #1, then try
    // to create another trip on attempt #2 because attachToReservationId
    // never got set.
    setAttachToReservationId(result.reservationId);
    setReservationId(result.reservationId);

    // Force the existingBookings refetch so duplicate-pre-checks (e.g.
    // "Your existing trip already has a day-pass…") see the new items.
    setExistingBookingsRefreshKey((k) => k + 1);
  }, []);

  // Anchor the cart on a reservation that already has a confirmed room.
  // Synthesises a cart room from the chosen room booking (marked with
  // `existingId`) so the rest of the flow (step unlocks, date filters,
  // conflict pre-checks) works naturally. submitCart skips POSTing rooms
  // that carry an existingId.
  const startFromExistingReservation = useCallback(
    (reservation: Reservation, anchor: RoomBooking) => {
      if (!anchor.hotel || !anchor.room_type) return;

      setCart({
        rooms: [
          {
            hotel: anchor.hotel,
            roomType: anchor.room_type,
            checkIn: anchor.check_in_date,
            checkOut: anchor.check_out_date,
            guests: anchor.guests,
            existingId: anchor.id,
          },
        ],
        ferries: [],
        parkTickets: [],
        parkActivities: [],
        beachActivities: [],
      });
      setReservationId(reservation.id);
      setAttachToReservationId(reservation.id);
      setRoomAlreadyExists(true);
    },
    [],
  );

  const primaryRoom = cart.rooms[0] ?? null;
  const tripWindow = useMemo(() => computeTripWindow(cart.rooms), [cart.rooms]);
  const hasRoom = cart.rooms.length > 0;

  const hasExistingDayPass = existingBookings.parkBookings.length > 0;

  const isStepUnlocked = useCallback(
    (step: BookingStep): boolean => {
      switch (step) {
        case "room":
          return true;
        case "ferry":
        case "park-ticket":
        case "beach-activity":
          return hasRoom;
        case "park-activity":
          return (
            hasRoom &&
            (cart.parkTickets.length > 0 || hasExistingDayPass)
          );
      }
    },
    [hasRoom, cart.parkTickets.length, hasExistingDayPass],
  );

  const stepLockReason = useCallback(
    (step: BookingStep): string | null => {
      if (isStepUnlocked(step)) return null;
      if (step === "park-activity" && hasRoom) {
        return "Book a theme park ticket first to add park activities.";
      }
      return "Book a room first to unlock this step.";
    },
    [isStepUnlocked, hasRoom],
  );

  const hasAnyAddOn =
    cart.ferries.length > 0 ||
    cart.parkTickets.length > 0 ||
    cart.parkActivities.length > 0 ||
    cart.beachActivities.length > 0;

  const hasStagedItems = hasStagedItemsHelper({
    cart,
    attachToReservationId,
    roomAlreadyExists,
    activeStep,
  });

  const canBook = hasRoom;

  // Skip locked steps when navigating — pressing Next on the room step
  // when no ticket steps are unlocked yet just dead-ends, but with at
  // least one room confirmed, all single-step deps are satisfied. The
  // park-activity step can still be locked if no parkTicket; the loop
  // walks past it to the next valid stop.
  const findStepIndex = (step: BookingStep) =>
    STEP_ORDER.indexOf(step);

  const goToNextStep = useCallback(() => {
    const idx = findStepIndex(activeStep);
    for (let i = idx + 1; i < STEP_ORDER.length; i++) {
      if (isStepUnlocked(STEP_ORDER[i])) {
        setActiveStep(STEP_ORDER[i]);
        return;
      }
    }
  }, [activeStep, isStepUnlocked]);

  const goToPreviousStep = useCallback(() => {
    const idx = findStepIndex(activeStep);
    for (let i = idx - 1; i >= 0; i--) {
      if (isStepUnlocked(STEP_ORDER[i])) {
        setActiveStep(STEP_ORDER[i]);
        return;
      }
    }
  }, [activeStep, isStepUnlocked]);

  const hasPreviousStep = useMemo(() => {
    const idx = findStepIndex(activeStep);
    for (let i = idx - 1; i >= 0; i--) {
      if (isStepUnlocked(STEP_ORDER[i])) return true;
    }
    return false;
  }, [activeStep, isStepUnlocked]);

  const hasNextStep = useMemo(() => {
    const idx = findStepIndex(activeStep);
    for (let i = idx + 1; i < STEP_ORDER.length; i++) {
      if (isStepUnlocked(STEP_ORDER[i])) return true;
    }
    return false;
  }, [activeStep, isStepUnlocked]);

  const tryCommitActiveStep = useCallback((): boolean => {
    const fn = stepCommittersRef.current[activeStep];
    if (!fn) return true;
    return fn();
  }, [activeStep]);

  const submitCart = useCallback(async (): Promise<SubmitResult> => {
    const result: SubmitResult = {
      reservationId: null,
      rooms: [],
      parkBookings: [],
      parkActivityBookings: [],
      beachBookings: [],
      ferryBookings: [],
      errors: [],
    };

    if (cart.rooms.length === 0) {
      result.errors.push({
        step: "room",
        message: "Add at least one room before sending the booking.",
        fieldErrors: {},
      });
      return result;
    }

    setSubmitting(true);
    try {
      // Resolve reservation_id. Three entry conditions:
      //  - Anchored on existing trip → already have an id, skip any
      //    rooms carrying `existingId` (they're already booked).
      //  - Cross-session attach (overlap dialog) → start with that id.
      //  - Fresh trip → first POST creates the reservation, capture its
      //    id and reuse it for any subsequent rooms.
      let rid: number | null = attachToReservationId;

      // Rooms that need a POST. Existing-anchor rooms are skipped.
      const newRooms = cart.rooms.filter((r) => !r.existingId);

      for (const room of newRooms) {
        try {
          const created = await createRoomBooking({
            reservation_id: rid ?? undefined,
            room_type_id: room.roomType.id,
            check_in_date: room.checkIn,
            check_out_date: room.checkOut,
            guests: room.guests,
          });
          result.rooms.push(created.data);
          if (rid === null) {
            rid = created.data.reservation_id;
            setReservationId(rid);
          }
        } catch (error) {
          result.errors.push(toStepError("room", error));
          // First-room failure means we never got a reservation id; the
          // rest of the pipeline can't run, so abort.
          if (rid === null) return result;
        }
      }

      if (rid === null) {
        // No new rooms posted AND no anchored reservation_id — would only
        // happen if every room in cart was anchored but somehow attach id
        // wasn't set. Treat as hard error.
        result.errors.push({
          step: "room",
          message: "No reservation id could be resolved.",
          fieldErrors: {},
        });
        return result;
      }
      result.reservationId = rid;

      // Independent items in parallel. Park tickets all fan out here so
      // their day-passes are in place before we kick off park activities
      // sequentially below — one activity per (park, date) needs the
      // matching ticket landed first.
      const reservationId = rid;
      const independent: Array<Promise<void>> = [];

      for (const ticketSelection of cart.parkTickets) {
        independent.push(
          createParkBooking({
            reservation_id: reservationId,
            park_id: ticketSelection.park.id,
            date: ticketSelection.visitDate,
            guests: ticketSelection.guests,
          })
            .then((res) => {
              result.parkBookings.push(res.data);
            })
            .catch((error) => {
              result.errors.push(toStepError("park-ticket", error));
            }),
        );
      }

      for (const beachSelection of cart.beachActivities) {
        independent.push(
          createBeachBooking({
            reservation_id: reservationId,
            beach_activity_schedule_id: beachSelection.schedule.id,
            guests: beachSelection.guests,
          })
            .then((res) => {
              result.beachBookings.push(res.data);
            })
            .catch((error) => {
              result.errors.push(toStepError("beach-activity", error));
            }),
        );
      }

      for (const ferrySelection of cart.ferries) {
        independent.push(
          createFerryBooking({
            reservation_id: reservationId,
            ferry_schedule_id: ferrySelection.schedule.id,
            travel_date: ferrySelection.travelDate,
            guests: ferrySelection.passengers,
          })
            .then((res) => {
              result.ferryBookings.push(res.data);
            })
            .catch((error) => {
              result.errors.push(toStepError("ferry", error));
            }),
        );
      }

      await Promise.all(independent);

      // Park activities depend on a same-(park, date) day-pass. We accept
      // either a freshly-confirmed park booking from this submit OR an
      // existing confirmed one from the reservation. If a cart ticket was
      // attempted for that pair and failed, skip the activity with a
      // clear error rather than letting the API 422.
      const newPassDates = new Set(
        result.parkBookings
          .filter((pb) => pb.status === "confirmed")
          .map((pb) => `${pb.park_id}|${pb.date}`),
      );
      const existingPassDates = existingBookings.parkDates;

      const activityPromises = cart.parkActivities.map(
        async (parkActivitySelection) => {
          const activityDate =
            parkActivitySelection.schedule?.date ??
            parkActivitySelection.date ??
            null;
          const activityParkId = parkActivitySelection.activity.park_id;

          if (activityDate === null) {
            result.errors.push({
              step: "park-activity",
              message: `Park activity "${parkActivitySelection.activity.name}" is missing a date — pick a schedule or set a date.`,
              fieldErrors: {},
            });
            return;
          }

          const passKey = `${activityParkId}|${activityDate}`;
          const hasPass =
            newPassDates.has(passKey) || existingPassDates.has(passKey);

          if (!hasPass) {
            // The cart had a ticket for this (park, date) but it didn't
            // land — skip with the failure-cascade message. If there
            // never was a matching ticket, surface the missing-day-pass
            // error so the customer can fix the cart.
            const ticketWasAttempted = cart.parkTickets.some(
              (t) =>
                t.park.id === activityParkId && t.visitDate === activityDate,
            );
            result.errors.push({
              step: "park-activity",
              message: ticketWasAttempted
                ? `"${parkActivitySelection.activity.name}" skipped — the day-pass for ${activityDate} didn't book successfully.`
                : `"${parkActivitySelection.activity.name}" needs a day-pass for ${activityDate}.`,
              fieldErrors: {},
            });
            return;
          }

          const payload = parkActivitySelection.schedule
            ? {
                reservation_id: reservationId,
                park_activity_schedule_id: parkActivitySelection.schedule.id,
                guests: parkActivitySelection.guests,
              }
            : {
                reservation_id: reservationId,
                park_activity_id: parkActivitySelection.activity.id,
                date: activityDate,
                guests: parkActivitySelection.guests,
              };

          try {
            const res = await createParkActivityBooking(payload);
            result.parkActivityBookings.push(res.data);
          } catch (error) {
            result.errors.push(toStepError("park-activity", error));
          }
        },
      );

      await Promise.all(activityPromises);

      return result;
    } finally {
      setSubmitting(false);
    }
  }, [cart, attachToReservationId, existingBookings.parkDates]);

  const value = useMemo<BookingCartContextValue>(
    () => ({
      cart,
      reservationId,
      attachToReservationId,
      setAttachToReservationId,
      roomAlreadyExists,
      startFromExistingReservation,
      addRoom,
      removeRoom,
      clearRooms,
      primaryRoom,
      tripWindow,
      addFerry,
      removeFerry,
      clearFerries,
      addParkTicket,
      removeParkTicket,
      clearParkTickets,
      addParkActivity,
      removeParkActivity,
      clearParkActivities,
      addBeachActivity,
      removeBeachActivity,
      clearBeachActivities,
      isStepUnlocked,
      stepLockReason,
      hasAnyAddOn,
      canBook,
      submitting,
      submitCart,
      existingBookings,
      consumeSubmitResult,
      hasStagedItems,
      isHydrated,
      activeStep,
      setActiveStep,
      goToNextStep,
      goToPreviousStep,
      hasPreviousStep,
      hasNextStep,
      registerStepCommitter,
      tryCommitActiveStep,
      reset,
    }),
    [
      cart,
      reservationId,
      attachToReservationId,
      roomAlreadyExists,
      startFromExistingReservation,
      addRoom,
      removeRoom,
      clearRooms,
      primaryRoom,
      tripWindow,
      addFerry,
      removeFerry,
      clearFerries,
      addParkTicket,
      removeParkTicket,
      clearParkTickets,
      addParkActivity,
      removeParkActivity,
      clearParkActivities,
      addBeachActivity,
      removeBeachActivity,
      clearBeachActivities,
      isStepUnlocked,
      stepLockReason,
      hasAnyAddOn,
      canBook,
      submitting,
      submitCart,
      existingBookings,
      consumeSubmitResult,
      hasStagedItems,
      isHydrated,
      activeStep,
      goToNextStep,
      goToPreviousStep,
      hasPreviousStep,
      hasNextStep,
      registerStepCommitter,
      tryCommitActiveStep,
      reset,
    ],
  );

  return (
    <BookingCartContext.Provider value={value}>
      {children}
    </BookingCartContext.Provider>
  );
}

export function useBookingCart() {
  const context = useContext(BookingCartContext);
  if (!context) {
    throw new Error(
      "useBookingCart must be used inside a BookingCartProvider",
    );
  }
  return context;
}
