"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  BeachActivitySelection,
  BookingCart,
  BookingStep,
  FerrySelection,
  ParkActivitySelection,
  ParkTicketSelection,
  RoomSelection,
} from "@/types/booking";

type BookingCartContextValue = {
  cart: BookingCart;
  setRoom: (selection: RoomSelection | null) => void;
  setFerry: (selection: FerrySelection | null) => void;
  setParkTicket: (selection: ParkTicketSelection | null) => void;
  setParkActivity: (selection: ParkActivitySelection | null) => void;
  setBeachActivity: (selection: BeachActivitySelection | null) => void;
  isStepUnlocked: (step: BookingStep) => boolean;
  stepLockReason: (step: BookingStep) => string | null;
  hasAnyAddOn: boolean;
  canBook: boolean;
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

export function BookingCartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<BookingCart>(EMPTY_CART);

  // Clearing the room booking invalidates every dependent step — the rule is
  // "room first, then everything else", so no add-on survives without it.
  const setRoom = useCallback((selection: RoomSelection | null) => {
    setCart((prev) =>
      selection === null
        ? EMPTY_CART
        : { ...prev, room: selection },
    );
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

  const reset = useCallback(() => setCart(EMPTY_CART), []);

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
          return cart.room !== null && cart.parkTicket !== null;
      }
    },
    [cart.room, cart.parkTicket],
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

  const value = useMemo<BookingCartContextValue>(
    () => ({
      cart,
      setRoom,
      setFerry,
      setParkTicket,
      setParkActivity,
      setBeachActivity,
      isStepUnlocked,
      stepLockReason,
      hasAnyAddOn,
      canBook,
      reset,
    }),
    [
      cart,
      setRoom,
      setFerry,
      setParkTicket,
      setParkActivity,
      setBeachActivity,
      isStepUnlocked,
      stepLockReason,
      hasAnyAddOn,
      canBook,
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
