"use client";

import { useBookingCart } from "@/context/booking-cart-context";

type Props = {
  // Called before advancing. Return false to block navigation (validation
  // failed). Throwing or returning a Promise that resolves false also
  // blocks. If the step has no commit semantics (e.g. nothing the user
  // could have entered), pass undefined.
  onNext?: () => boolean | Promise<boolean>;
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
  } = useBookingCart();

  const handleNext = async () => {
    if (onNext) {
      const ok = await onNext();
      if (!ok) return;
    }
    goToNextStep();
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
