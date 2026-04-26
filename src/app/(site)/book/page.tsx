"use client";

import { useEffect, useRef, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AttachReservationDialog } from "@/components/booking/AttachReservationDialog";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { LockedNotice } from "@/components/booking/LockedNotice";
import { UpcomingTripSelector } from "@/components/booking/UpcomingTripSelector";
import { BeachActivityStep } from "@/components/booking/steps/BeachActivityStep";
import { FerryStep } from "@/components/booking/steps/FerryStep";
import { ParkActivityStep } from "@/components/booking/steps/ParkActivityStep";
import { RoomStep } from "@/components/booking/steps/RoomStep";
import { ThemeParkStep } from "@/components/booking/steps/ThemeParkStep";
import { CUSTOMER_ROLE } from "@/config/roles";
import {
  BookingCartProvider,
  useBookingCart,
} from "@/context/booking-cart-context";
import {
  findReservationsOverlapping,
  findUpcomingReservations,
} from "@/lib/api/reservations";
import type { BookingStep, Reservation } from "@/types/booking";

function BookingStepPanel({ step }: { step: BookingStep }) {
  const { isStepUnlocked, stepLockReason } = useBookingCart();

  if (!isStepUnlocked(step)) {
    const titles: Record<BookingStep, string> = {
      room: "Room",
      ferry: "Ferry",
      "park-ticket": "Theme park",
      "park-activity": "Park activity",
      "beach-activity": "Beach activity",
    };
    return (
      <LockedNotice
        title={titles[step]}
        reason={stepLockReason(step) ?? "Locked"}
      />
    );
  }

  switch (step) {
    case "room":
      return <RoomStep />;
    case "ferry":
      return <FerryStep />;
    case "park-ticket":
      return <ThemeParkStep />;
    case "park-activity":
      return <ParkActivityStep />;
    case "beach-activity":
      return <BeachActivityStep />;
  }
}

function BookingPageInner() {
  const [activeStep, setActiveStep] = useState<BookingStep>("room");
  const {
    cart,
    setAttachToReservationId,
    attachToReservationId,
    roomAlreadyExists,
    startFromExistingReservation,
  } = useBookingCart();

  const [overlapMatches, setOverlapMatches] = useState<Reservation[]>([]);
  const [showAttachDialog, setShowAttachDialog] = useState(false);

  const [upcomingReservations, setUpcomingReservations] = useState<
    Reservation[]
  >([]);

  // One-shot fetch when the page mounts. The selector is only useful before
  // the cart starts; once the user picks a trip (or books a fresh room) the
  // panel disappears, so a single load is enough.
  useEffect(() => {
    let cancelled = false;
    findUpcomingReservations()
      .then((reservations) => {
        if (cancelled) return;
        setUpcomingReservations(reservations);
      })
      .catch(() => {
        // Best-effort. If the lookup fails the user can still book a fresh
        // room; we just don't surface the convenience panel.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Track which (checkIn, checkOut) we already looked up so changing other
  // cart fields doesn't re-fire the network call. The dialog also won't
  // re-open once the customer has answered for these dates.
  const lastLookupRef = useRef<string | null>(null);

  useEffect(() => {
    // Anchored on an existing trip → no need to ask the user about
    // overlap, they already explicitly chose. Suppress the dialog flow.
    if (!cart.room || roomAlreadyExists) return;
    const key = `${cart.room.checkIn}|${cart.room.checkOut}`;
    if (lastLookupRef.current === key) return;
    lastLookupRef.current = key;

    let cancelled = false;
    findReservationsOverlapping(cart.room.checkIn, cart.room.checkOut)
      .then((matches) => {
        if (cancelled) return;
        if (matches.length === 0) {
          setAttachToReservationId(null);
          setOverlapMatches([]);
          setShowAttachDialog(false);
          return;
        }
        setOverlapMatches(matches);
        setShowAttachDialog(true);
      })
      .catch(() => {
        // Lookup is best-effort. Failure just means no auto-attach prompt;
        // the room POST will still create a fresh reservation and the user
        // is no worse off than before this filter shipped.
        if (cancelled) return;
        setOverlapMatches([]);
        setShowAttachDialog(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cart.room, roomAlreadyExists, setAttachToReservationId]);

  const showSelector = !cart.room && upcomingReservations.length > 0;

  return (
    <div className="bg-base min-h-screen pt-24 pb-12">
      <div className="mx-auto w-full max-w-7xl px-6">
        <header className="mb-8">
          <h1 className="text-primary text-4xl font-bold">Book your trip</h1>
          <p className="text-muted mt-2 max-w-2xl text-base">
            Start with a room — it unlocks ferries, theme parks, and beach
            activities. Park activities open once a theme park ticket is added.
          </p>
          {roomAlreadyExists && cart.room ? (
            <p className="text-primary mt-3 text-sm font-semibold">
              Adding to your existing trip at {cart.room.hotel.name},{" "}
              {cart.room.checkIn} – {cart.room.checkOut}.
            </p>
          ) : attachToReservationId !== null ? (
            <p className="text-primary mt-3 text-sm font-semibold">
              Attaching new room to existing trip #{attachToReservationId}.{" "}
              <button
                type="button"
                onClick={() => setAttachToReservationId(null)}
                className="underline"
              >
                Start a new trip instead
              </button>
            </p>
          ) : null}
        </header>

        {showSelector ? (
          <UpcomingTripSelector
            reservations={upcomingReservations}
            onSelect={(reservation, anchor) => {
              startFromExistingReservation(reservation, anchor);
              // Move the user past the room step automatically — the room
              // is already booked, the next thing they want is a ticket.
              setActiveStep("ferry");
            }}
          />
        ) : null}

        <BookingStepper active={activeStep} onChange={setActiveStep} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <BookingStepPanel step={activeStep} />
          </div>
          <BookingSummary />
        </div>
      </div>

      <AttachReservationDialog
        open={showAttachDialog}
        matches={overlapMatches}
        proposedCheckIn={cart.room?.checkIn ?? ""}
        proposedCheckOut={cart.room?.checkOut ?? ""}
        onAttach={(reservationId) => {
          setAttachToReservationId(reservationId);
          setShowAttachDialog(false);
        }}
        onStartFresh={() => {
          setAttachToReservationId(null);
          setShowAttachDialog(false);
        }}
      />
    </div>
  );
}

export default function BookingPage() {
  return (
    <ProtectedRoute allowedRoles={[CUSTOMER_ROLE]}>
      <BookingCartProvider>
        <BookingPageInner />
      </BookingCartProvider>
    </ProtectedRoute>
  );
}
