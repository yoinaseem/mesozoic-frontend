"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { LockedNotice } from "@/components/booking/LockedNotice";
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
import type { BookingStep } from "@/types/booking";

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

  return (
    <div className="bg-base min-h-screen pt-24 pb-12">
      <div className="mx-auto w-full max-w-7xl px-6">
        <header className="mb-8">
          <h1 className="text-primary text-4xl font-bold">Book your trip</h1>
          <p className="text-muted mt-2 max-w-2xl text-base">
            Start with a room — it unlocks ferries, theme parks, and beach
            activities. Park activities open once a theme park ticket is added.
          </p>
        </header>

        <BookingStepper active={activeStep} onChange={setActiveStep} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <BookingStepPanel step={activeStep} />
          </div>
          <BookingSummary />
        </div>
      </div>
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
