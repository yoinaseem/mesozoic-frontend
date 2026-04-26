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

// One slot per booking type. The submit pipeline runs in dependency order:
// room first (so we have a reservation_id), then tickets in parallel where
// they're independent (parkTicket / beach / ferry), and parkActivity last
// because the API requires the day-pass row to already exist.
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
  room: RoomBooking | null;
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
  // `${park_id}|${date}` — park-day-pass uniqueness is per (reservation, park, date).
  parkDates: Set<string>;
  // beach uniqueness is per (reservation, schedule_id) — schedule_id alone suffices.
  beachScheduleIds: Set<number>;
  // park-activity uniqueness is per (reservation, schedule_id).
  parkActivityScheduleIds: Set<number>;
  // ferry uniqueness is per (reservation, schedule_id, travel_date) — the
  // composite key is what the step needs to flag conflicts.
  ferryScheduleDates: Set<string>; // `${schedule_id}|${travel_date}`
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

type BookingCartContextValue = {
  cart: BookingCart;
  reservationId: number | null;
  // Caller-supplied reservation_id for cross-session attachment. Set by the
  // overlap-prompt UI when the customer chooses "attach to existing trip";
  // null means "let the room POST create a fresh reservation".
  attachToReservationId: number | null;
  setAttachToReservationId: (id: number | null) => void;
  // True when the cart is anchored on a reservation that already has a
  // confirmed room booking — we synthesise cart.room from it so steps
  // unlock and date math works, but submitCart skips the room POST. The
  // overlap dialog flow keeps this false because the user is booking a
  // brand-new room into the existing trip.
  roomAlreadyExists: boolean;
  startFromExistingReservation: (
    reservation: Reservation,
    anchorRoomBooking: RoomBooking,
  ) => void;
  setRoom: (selection: RoomSelection | null) => void;
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
  // Conflict sets sourced from the reservation we're attaching to. Empty
  // when not attaching (or while the fetch is in flight).
  existingBookings: ExistingReservationBookings;
  reset: () => void;
};

const EMPTY_CART: BookingCart = {
  room: null,
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

export function BookingCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<BookingCart>(EMPTY_CART);
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [attachToReservationId, setAttachToReservationId] = useState<
    number | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [roomAlreadyExists, setRoomAlreadyExists] = useState(false);
  const [existingBookings, setExistingBookings] =
    useState<ExistingReservationBookings>(EMPTY_EXISTING);

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
        // Best-effort. If the lookup fails the API will still 422 on
        // submit; UX is mildly worse but the booking can't slip through.
        if (cancelled) return;
        setExistingBookings(EMPTY_EXISTING);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attachToReservationId]);

  // Clearing the room booking invalidates every dependent step — the rule is
  // "room first, then everything else", so no add-on survives without it.
  // Also drops any cached reservation_id so the next room POST starts fresh.
  // Editing the room while anchored on an existing reservation drops the
  // anchor — the user is now describing a new room, not the saved one.
  const setRoom = useCallback((selection: RoomSelection | null) => {
    setCart((prev) =>
      selection === null
        ? EMPTY_CART
        : { ...prev, room: selection },
    );
    if (selection === null) {
      setReservationId(null);
      setAttachToReservationId(null);
      setRoomAlreadyExists(false);
    } else if (roomAlreadyExists) {
      setRoomAlreadyExists(false);
      setAttachToReservationId(null);
      setReservationId(null);
    }
  }, [roomAlreadyExists]);

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
  }, []);

  // Anchor the cart on a reservation that already has a confirmed room.
  // Synthesises cart.room from the chosen room booking so the rest of the
  // flow (step unlocks, date-window filters, conflict pre-checks) works
  // exactly as if the user had just confirmed a room — except submitCart
  // will skip the room POST.
  const startFromExistingReservation = useCallback(
    (reservation: Reservation, anchor: RoomBooking) => {
      // The reservations index eager-loads hotel/room_type/room on each
      // room booking (per API_INTEGRATION.md §10), so these should always
      // be present. Bail rather than render a half-set cart if not.
      if (!anchor.hotel || !anchor.room_type) return;

      setCart({
        room: {
          hotel: anchor.hotel,
          roomType: anchor.room_type,
          checkIn: anchor.check_in_date,
          checkOut: anchor.check_out_date,
          guests: anchor.guests,
        },
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

  // park-activity also unlocks when an existing day-pass is already on the
  // attached reservation — the API's prerequisite is a confirmed ParkBooking
  // on the reservation (§14), and that's satisfied either by an in-cart
  // ticket about to be POSTed or by one already on the trip.
  const hasExistingDayPass = existingBookings.parkBookings.length > 0;

  const isStepUnlocked = useCallback(
    (step: BookingStep): boolean => {
      switch (step) {
        case "room":
          return true;
        case "ferry":
        case "park-ticket":
        case "beach-activity":
          return cart.room !== null;
        case "park-activity":
          return (
            cart.room !== null &&
            (cart.parkTicket !== null || hasExistingDayPass)
          );
      }
    },
    [cart.room, cart.parkTicket, hasExistingDayPass],
  );

  const stepLockReason = useCallback(
    (step: BookingStep): string | null => {
      if (isStepUnlocked(step)) return null;
      if (step === "park-activity" && cart.room !== null) {
        return "Book a theme park ticket first to add park activities.";
      }
      return "Book a room first to unlock this step.";
    },
    [isStepUnlocked, cart.room],
  );

  const hasAnyAddOn =
    cart.ferry !== null ||
    cart.parkTicket !== null ||
    cart.parkActivity !== null ||
    cart.beachActivity !== null;

  const canBook = cart.room !== null;

  const submitCart = useCallback(async (): Promise<SubmitResult> => {
    const result: SubmitResult = {
      reservationId: null,
      room: null,
      parkBooking: null,
      parkActivityBooking: null,
      beachBooking: null,
      ferryBooking: null,
      errors: [],
    };

    if (!cart.room) {
      result.errors.push({
        step: "room",
        message: "Confirm a room before sending the booking.",
        fieldErrors: {},
      });
      return result;
    }

    setSubmitting(true);
    try {
      // Step 1: room booking — anchors the reservation. Three cases:
      //  - Fresh trip: POST without reservation_id, server auto-creates one.
      //  - Cross-session attach (overlap dialog): POST with reservation_id.
      //  - Anchored on existing trip (roomAlreadyExists): skip the POST
      //    entirely; the room is already booked, we just need its
      //    reservation_id for the ticket POSTs.
      let rid: number;

      if (roomAlreadyExists) {
        if (attachToReservationId === null) {
          // Defensive — startFromExistingReservation always sets both, but
          // a bad sequence of state edits could land here. Treat it as a
          // hard error rather than silently posting a fresh room.
          result.errors.push({
            step: "room",
            message:
              "Anchored on an existing trip but no reservation id is set.",
            fieldErrors: {},
          });
          return result;
        }
        rid = attachToReservationId;
        result.reservationId = rid;
      } else {
        let roomBooking: RoomBooking;
        try {
          const created = await createRoomBooking({
            reservation_id: attachToReservationId ?? undefined,
            room_type_id: cart.room.roomType.id,
            check_in_date: cart.room.checkIn,
            check_out_date: cart.room.checkOut,
            guests: cart.room.guests,
          });
          roomBooking = created.data;
        } catch (error) {
          result.errors.push(toStepError("room", error));
          return result;
        }

        result.room = roomBooking;
        result.reservationId = roomBooking.reservation_id;
        setReservationId(roomBooking.reservation_id);
        rid = roomBooking.reservation_id;
      }

      // Step 2: independent tickets in parallel. parkTicket runs on its own
      // because parkActivity depends on it landing as confirmed first.
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

      // Step 3: park activity. Only attempt when the prerequisite day-pass
      // landed in this submit (or was already on the reservation — caller
      // would still have to pre-validate that).
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
          try {
            const res = await createParkActivityBooking({
              reservation_id: rid,
              park_activity_schedule_id: parkActivitySelection.schedule.id,
              guests: parkActivitySelection.guests,
            });
            result.parkActivityBooking = res.data;
          } catch (error) {
            result.errors.push(toStepError("park-activity", error));
          }
        }
      }

      return result;
    } finally {
      setSubmitting(false);
    }
  }, [cart, attachToReservationId, roomAlreadyExists]);

  const value = useMemo<BookingCartContextValue>(
    () => ({
      cart,
      reservationId,
      attachToReservationId,
      setAttachToReservationId,
      roomAlreadyExists,
      startFromExistingReservation,
      setRoom,
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
      reset,
    }),
    [
      cart,
      reservationId,
      attachToReservationId,
      roomAlreadyExists,
      startFromExistingReservation,
      setRoom,
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
