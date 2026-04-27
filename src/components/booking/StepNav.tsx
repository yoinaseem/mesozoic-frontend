"use client";

import type { BookingStep } from "@/types/booking";
import { useBookingCart } from "@/context/booking-cart-context";

// onNext can return:
//  - false: validation blocked navigation, stay on this step
//  - true:  advance using the normal "next unlocked step" walk
//  - BookingStep: jump directly to that step. Used when the step just
//    committed something that unlocks a downstream step (e.g. adding
//    a park ticket unlocks park-activity); the standard goToNextStep
//    walk would still see the pre-commit cart and skip the now-valid
//    target.
type NextResult = boolean | BookingStep;

type Props = {
  onNext?: () => NextResult | Promise<NextResult>;
  // Called before going back. Default is "just navigate, don't commit".
  onPrevious?: () => boolean | Promise<boolean>;
  // Optional extra controls on the left side of the footer (e.g. a
  // step-specific Clear or Add-another button).
  leadingActions?: React.ReactNode;
};

export function StepNav({ onNext, onPrevious, leadingActions }: Props) {
  const {
    goToNextStep,
    goToPreviousStep,
    hasPreviousStep,
    hasNextStep,
    setActiveStep,
  } = useBookingCart();

  const handleNext = async () => {
    if (!onNext) {
      goToNextStep();
      return;
    }
    const result = await onNext();
    if (result === false) return;
    if (result === true) {
      goToNextStep();
      return;
    }
    setActiveStep(result);
  };

  const handlePrevious = async () => {
    if (onPrevious) {
      const ok = await onPrevious();
      if (!ok) return;
    }
    goToPreviousStep();
  };

  // When there's no later step to navigate to (last step in the flow,
  // or every later step is locked) the button still needs to commit the
  // form — that's the customer's only "Add to cart" affordance for steps
  // that don't surface a separate add button (i.e. every step except
  // RoomStep). Relabel for clarity; goToNextStep() is a no-op in that
  // case so the customer stays on the page after commit.
  const nextLabel = hasNextStep ? "Next" : "Add to cart";

  return (
    <div className="border-base flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <div className="flex flex-wrap items-center gap-3">{leadingActions}</div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="border-base text-base-color hover:bg-base/40 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg border px-5 py-2 text-sm font-semibold transition-colors"
          onClick={handlePrevious}
          disabled={!hasPreviousStep}
        >
          Previous
        </button>
        <button type="button" className="btn-primary" onClick={handleNext}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
