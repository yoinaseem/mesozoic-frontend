"use client";

import { Check, Lock } from "lucide-react";
import { useBookingCart } from "@/context/booking-cart-context";
import type { BookingStep } from "@/types/booking";

type StepDef = {
  key: BookingStep;
  label: string;
  hint: string;
};

const STEPS: StepDef[] = [
  { key: "room", label: "Room", hint: "Required" },
  { key: "ferry", label: "Ferry", hint: "Optional" },
  { key: "park-ticket", label: "Park ticket", hint: "Optional" },
  { key: "park-activity", label: "Park activity", hint: "Needs park ticket" },
  { key: "beach-activity", label: "Beach activity", hint: "Optional" },
];

type BookingStepperProps = {
  active: BookingStep;
  onChange: (step: BookingStep) => void;
};

export function BookingStepper({ active, onChange }: BookingStepperProps) {
  const { cart, isStepUnlocked, tryCommitActiveStep } = useBookingCart();

  const isDone = (step: BookingStep) => {
    switch (step) {
      case "room":
        return cart.rooms.length > 0;
      case "ferry":
        return cart.ferries.length > 0;
      case "park-ticket":
        return cart.parkTickets.length > 0;
      case "park-activity":
        return cart.parkActivities.length > 0;
      case "beach-activity":
        return cart.beachActivities.length > 0;
    }
  };

  // Tab click runs the active step's tryCommit() first so any partially
  // filled form is saved (or surfaces a validation error and blocks)
  // before we navigate away. Same step click skips the commit — clicking
  // your own tab shouldn't validate.
  const handleTabClick = (target: BookingStep) => {
    if (target === active) return;
    if (!tryCommitActiveStep()) return;
    onChange(target);
  };

  return (
    <nav
      role="tablist"
      aria-label="Booking steps"
      className="border-base bg-surface flex gap-1 overflow-x-auto rounded-lg border p-1"
    >
      {STEPS.map((step) => {
        const unlocked = isStepUnlocked(step.key);
        const done = isDone(step.key);
        const isActive = active === step.key;

        return (
          <button
            key={step.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={!unlocked}
            disabled={!unlocked}
            onClick={() => unlocked && handleTabClick(step.key)}
            className={`flex min-w-[10rem] flex-1 flex-col items-start gap-1 rounded-md px-3 py-2 text-left text-sm transition-colors ${
              isActive
                ? "bg-primary text-white"
                : unlocked
                ? "hover:bg-base text-base-color"
                : "text-muted cursor-not-allowed opacity-60"
            }`}
          >
            <span className="flex items-center gap-2 font-semibold">
              {done ? (
                <Check className="size-4" aria-hidden />
              ) : !unlocked ? (
                <Lock className="size-4" aria-hidden />
              ) : null}
              {step.label}
            </span>
            <span
              className={
                isActive ? "text-xs text-white/80" : "text-muted text-xs"
              }
            >
              {step.hint}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
