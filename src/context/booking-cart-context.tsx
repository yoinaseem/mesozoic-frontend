"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  parkBooking: ParkBooking | null;
  parkActivityBooking: ParkActivityBooking | null;
  beachBooking: BeachBooking | null;
  ferryBooking: FerryBooking | null;
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
  setFerry: (selection: FerrySelection | null) => void;
  setParkTicket: (selection: ParkTicketSelection | null) => void;
  setParkActivity: (selection: ParkActivitySelection | null) => void;
  setBeachActivity: (selection: BeachActivitySelection | null) => void;
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
  reset: () => void;
};

const EMPTY_CART: BookingCart = {
  rooms: [],
  ferry: null,
  parkTicket: null,
  parkActivity: null,
  beachActivity: null,
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

  const setFerry = useCallback((selection: FerrySelection | null) => {
    setCart((prev) => ({ ...prev, ferry: selection }));
  }, []);

  // A park activity only makes sense when a park ticket is held, so dropping
  // the ticket also drops the activity.
  const setParkTicket = useCallback((selection: ParkTicketSelection | null) => {
    setCart((prev) =>
      selection === null
        ? { ...prev, parkTicket: null, parkActivity: null }
        : { ...prev, parkTicket: selection },
    );
  }, []);

  const setParkActivity = useCallback(
    (selection: ParkActivitySelection | null) => {
      setCart((prev) => ({ ...prev, parkActivity: selection }));
    },
    [],
  );

  const setBeachActivity = useCallback(
    (selection: BeachActivitySelection | null) => {
      setCart((prev) => ({ ...prev, beachActivity: selection }));
    },
    [],
  );

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

      // Successful ticket slots clear so a retry doesn't re-POST them.
      // The just-posted rows show up in existingBookings after the
      // refresh below, so the customer still sees them in the summary.
      if (result.parkBooking) next.parkTicket = null;
      if (result.beachBooking) next.beachActivity = null;
      if (result.ferryBooking) next.ferry = null;
      if (result.parkActivityBooking) next.parkActivity = null;

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
        ferry: null,
        parkTicket: null,
        parkActivity: null,
        beachActivity: null,
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
          return hasRoom && (cart.parkTicket !== null || hasExistingDayPass);
      }
    },
    [hasRoom, cart.parkTicket, hasExistingDayPass],
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
    cart.ferry !== null ||
    cart.parkTicket !== null ||
    cart.parkActivity !== null ||
    cart.beachActivity !== null;

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

  const submitCart = useCallback(async (): Promise<SubmitResult> => {
    const result: SubmitResult = {
      reservationId: null,
      rooms: [],
      parkBooking: null,
      parkActivityBooking: null,
      beachBooking: null,
      ferryBooking: null,
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

      // Independent tickets in parallel. parkTicket runs alongside the
      // others because parkActivity sequentially waits for it below.
      const independent: Array<Promise<void>> = [];

      if (cart.parkTicket) {
        const ticketSelection = cart.parkTicket;
        independent.push(
          createParkBooking({
            reservation_id: rid,
            park_id: ticketSelection.park.id,
            date: ticketSelection.visitDate,
            guests: ticketSelection.guests,
          })
            .then((res) => {
              result.parkBooking = res.data;
            })
            .catch((error) => {
              result.errors.push(toStepError("park-ticket", error));
            }),
        );
      }

      if (cart.beachActivity) {
        const beachSelection = cart.beachActivity;
        independent.push(
          createBeachBooking({
            reservation_id: rid,
            beach_activity_schedule_id: beachSelection.schedule.id,
            guests: beachSelection.guests,
          })
            .then((res) => {
              result.beachBooking = res.data;
            })
            .catch((error) => {
              result.errors.push(toStepError("beach-activity", error));
            }),
        );
      }

      if (cart.ferry) {
        const ferrySelection = cart.ferry;
        independent.push(
          createFerryBooking({
            reservation_id: rid,
            ferry_schedule_id: ferrySelection.schedule.id,
            travel_date: ferrySelection.travelDate,
            guests: ferrySelection.passengers,
          })
            .then((res) => {
              result.ferryBooking = res.data;
            })
            .catch((error) => {
              result.errors.push(toStepError("ferry", error));
            }),
        );
      }

      await Promise.all(independent);

      if (cart.parkActivity) {
        const parkActivitySelection = cart.parkActivity;
        const dayPassLanded =
          result.parkBooking !== null && result.parkBooking.status === "confirmed";

        if (!dayPassLanded && cart.parkTicket) {
          result.errors.push({
            step: "park-activity",
            message:
              "Park activity skipped — the day-pass booking failed, so the activity has no prerequisite.",
            fieldErrors: {},
          });
        } else {
          const payload = parkActivitySelection.schedule
            ? {
                reservation_id: rid,
                park_activity_schedule_id: parkActivitySelection.schedule.id,
                guests: parkActivitySelection.guests,
              }
            : parkActivitySelection.date
              ? {
                  reservation_id: rid,
                  park_activity_id: parkActivitySelection.activity.id,
                  date: parkActivitySelection.date,
                  guests: parkActivitySelection.guests,
                }
              : null;

          if (payload === null) {
            result.errors.push({
              step: "park-activity",
              message:
                "Park activity selection is incomplete — pick a schedule or date.",
              fieldErrors: {},
            });
          } else {
            try {
              const res = await createParkActivityBooking(payload);
              result.parkActivityBooking = res.data;
            } catch (error) {
              result.errors.push(toStepError("park-activity", error));
            }
          }
        }
      }

      return result;
    } finally {
      setSubmitting(false);
    }
  }, [cart, attachToReservationId]);

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
      setFerry,
      setParkTicket,
      setParkActivity,
      setBeachActivity,
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
      setFerry,
      setParkTicket,
      setParkActivity,
      setBeachActivity,
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
