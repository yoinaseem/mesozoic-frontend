"use client";

import { ArrowLeft, Pencil, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { CUSTOMER_ROLE } from "@/config/roles";
import {
  BookingCartProvider,
  type SubmitResult,
  useBookingCart,
} from "@/context/booking-cart-context";
import {
  prevalidateCart,
  type PrevalidationIssue,
} from "@/lib/checkout-prevalidate";
import type { BookingStep } from "@/types/booking";

const STEP_LABELS: Record<BookingStep, string> = {
  room: "Room",
  ferry: "Ferry",
  "park-ticket": "Theme park ticket",
  "park-activity": "Park activity",
  "beach-activity": "Beach activity",
};

function formatMoney(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function CheckoutInner() {
  const router = useRouter();
  const {
    cart,
    hasStagedItems,
    isHydrated,
    tripWindow,
    submitting,
    submitCart,
    consumeSubmitResult,
    reset,
    setActiveStep,
    roomAlreadyExists,
  } = useBookingCart();

  const [issues, setIssues] = useState<PrevalidationIssue[]>([]);
  const [validating, setValidating] = useState(true);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  // Refs for scroll-to-error UX. We scroll the error block into view
  // whenever a fresh batch of error-severity issues lands or the submit
  // returns errors — otherwise the customer might confirm without
  // realising blockers were surfaced below the fold.
  const prevalidateErrorRef = useRef<HTMLDivElement>(null);
  const submitErrorRef = useRef<HTMLDivElement>(null);

  // Run prevalidation once the cart hydrates. Re-runs whenever the cart
  // shape changes (e.g. user edits then comes back).
  const lastValidatedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!hasStagedItems) return;
    const key = JSON.stringify({
      rooms: cart.rooms.map((r) => `${r.hotel.id}-${r.roomType.id}-${r.checkIn}-${r.checkOut}-${r.existingId ?? ""}`),
      ferries: cart.ferries.map(
        (f) => `${f.schedule.id}-${f.travelDate}-${f.passengers}`,
      ),
      parkTickets: cart.parkTickets.map(
        (t) => `${t.park.id}-${t.visitDate}-${t.guests}`,
      ),
      parkActivities: cart.parkActivities.map(
        (a) =>
          `${a.activity.id}-${a.schedule?.id ?? a.date ?? ""}-${a.guests}`,
      ),
      beachActivities: cart.beachActivities.map(
        (b) => `${b.schedule.id}-${b.guests}`,
      ),
    });
    if (lastValidatedRef.current === key) return;
    lastValidatedRef.current = key;

    let cancelled = false;
    prevalidateCart(cart)
      .then((found) => {
        if (cancelled) return;
        setIssues(found);
        setValidating(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIssues([]);
        setValidating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cart, hasStagedItems]);

  // Empty-cart guard. Wait for hydration to finish before deciding —
  // otherwise we race the localStorage load and bounce the customer
  // back to /book with a still-empty cart.
  useEffect(() => {
    if (!isHydrated) return;
    if (!hasStagedItems && !submitResult) {
      router.replace("/book");
    }
  }, [isHydrated, hasStagedItems, submitResult, router]);

  const totalEstimate = useMemo(() => {
    let total = 0;
    for (const room of cart.rooms) {
      if (room.existingId !== undefined) continue;
      const price = Number(room.roomType.price);
      const nights =
        (new Date(room.checkOut).getTime() - new Date(room.checkIn).getTime()) /
        (1000 * 60 * 60 * 24);
      if (Number.isFinite(price) && Number.isFinite(nights)) {
        total += price * nights;
      }
    }
    for (const ticket of cart.parkTickets) {
      const p = Number(ticket.park.price);
      if (Number.isFinite(p)) total += p * ticket.guests;
    }
    for (const ba of cart.beachActivities) {
      total += ba.activity.price * ba.guests;
    }
    for (const pa of cart.parkActivities) {
      const p = Number(pa.activity.price);
      if (Number.isFinite(p)) total += p * pa.guests;
    }
    for (const f of cart.ferries) {
      const p = Number(f.ferry.ferry_type?.price ?? 0);
      if (Number.isFinite(p)) total += p * f.passengers;
    }
    return total;
  }, [cart]);

  const errorIssues = issues.filter((i) => i.severity === "error");
  const warningIssues = issues.filter((i) => i.severity === "warning");

  // Scroll the prevalidate error block into view when a new batch of
  // blockers shows up. Keyed on validating+count so we only scroll on a
  // fresh validation result, not on every render.
  useEffect(() => {
    if (!validating && errorIssues.length > 0) {
      prevalidateErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [validating, errorIssues.length]);

  // Same for submit-time errors. submitResult identity changes when a
  // new submit lands.
  useEffect(() => {
    if (submitResult && submitResult.errors.length > 0) {
      submitErrorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [submitResult]);

  const editStep = (step: BookingStep) => {
    setActiveStep(step);
    router.push("/book");
  };

  const handleConfirm = async () => {
    if (errorIssues.length > 0) {
      toast.error(
        "Fix the highlighted issues before confirming the booking.",
      );
      return;
    }
    setSubmitResult(null);
    const result = await submitCart();
    setSubmitResult(result);
    consumeSubmitResult(result);

    if (result.errors.length === 0 && result.reservationId !== null) {
      toast.success("Booking success");
      reset();
      router.push("/dashboard");
      return;
    }

    if (result.reservationId === null) {
      toast.error(
        result.errors[0]?.message ?? "Could not complete the booking.",
      );
    } else {
      toast.warning(
        `Trip saved, but ${result.errors.length} item(s) need attention.`,
      );
    }
  };

  if (!isHydrated) {
    return (
      <div className="bg-base min-h-screen pt-24 pb-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-muted text-sm">Loading your cart…</p>
        </div>
      </div>
    );
  }

  if (!hasStagedItems && !submitResult) {
    return (
      <div className="bg-base min-h-screen pt-24 pb-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-muted">
            Your cart is empty. Redirecting back to the booking page…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base min-h-screen pt-24 pb-12">
      <div className="mx-auto w-full max-w-4xl px-6">
        <button
          type="button"
          onClick={() => router.push("/book")}
          className="text-muted hover:text-base-color mb-4 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to booking
        </button>

        <header className="mb-6">
          <h1 className="text-primary text-3xl font-bold">Review &amp; confirm</h1>
          <p className="text-muted mt-1 text-sm">
            Everything you&rsquo;ve added is staged and waiting. Confirm to
            send the booking.
          </p>
          {roomAlreadyExists ? (
            <p className="text-primary mt-2 text-sm font-semibold">
              Adding to your existing trip.
            </p>
          ) : null}
        </header>

        {validating ? (
          <div className="border-base bg-surface mb-4 flex items-center gap-3 rounded-xl border p-4 text-sm">
            <span className="border-primary size-4 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted">
              Checking availability for everything in your cart…
            </span>
          </div>
        ) : null}

        {!validating && errorIssues.length > 0 ? (
          <div
            ref={prevalidateErrorRef}
            className="border-danger/50 bg-danger/5 scroll-mt-24 mb-4 rounded-xl border p-4 text-sm"
            role="alert"
          >
            <p className="text-danger font-semibold">
              {errorIssues.length} item{errorIssues.length === 1 ? "" : "s"}{" "}
              can&rsquo;t be booked as-is:
            </p>
            <ul className="mt-2 space-y-1.5">
              {errorIssues.map((issue, i) => (
                <li
                  key={`${issue.step}-${i}`}
                  className="flex items-start justify-between gap-3"
                >
                  <span className="text-base-color">
                    <span className="font-medium">
                      {STEP_LABELS[issue.step]}:
                    </span>{" "}
                    {issue.message}
                  </span>
                  <button
                    type="button"
                    onClick={() => editStep(issue.step)}
                    className="text-primary shrink-0 text-xs font-semibold underline"
                  >
                    Fix
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!validating && warningIssues.length > 0 ? (
          <div className="border-amber-300 bg-amber-50 mb-4 rounded-xl border p-4 text-sm">
            <p className="font-semibold text-amber-800">Heads up:</p>
            <ul className="mt-1.5 space-y-1 text-amber-900">
              {warningIssues.map((issue, i) => (
                <li key={`${issue.step}-${i}`}>
                  <span className="font-medium">{STEP_LABELS[issue.step]}:</span>{" "}
                  {issue.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {submitResult && submitResult.errors.length > 0 ? (
          <div
            ref={submitErrorRef}
            className="border-danger/50 bg-danger/5 scroll-mt-24 mb-4 rounded-xl border p-4 text-sm"
            role="alert"
          >
            <p className="text-danger font-semibold">
              {submitResult.reservationId !== null
                ? "Some items couldn't be booked:"
                : "Booking failed:"}
            </p>
            <ul className="mt-2 space-y-1.5 text-base-color">
              {submitResult.errors.map((err) => (
                <li key={`${err.step}-${err.message}`}>
                  <span className="font-medium">{STEP_LABELS[err.step]}:</span>{" "}
                  {err.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-4">
          {cart.rooms.length > 0 ? (
            <CheckoutSection
              title={cart.rooms.length > 1 ? "Rooms" : "Room"}
              onEdit={() => editStep("room")}
            >
              <ul className="space-y-3">
                {cart.rooms.map((room, i) => (
                  <li key={i} className="space-y-0.5">
                    <p className="text-primary text-sm font-semibold">
                      {room.hotel.name} · {room.roomType.name}
                      {room.existingId !== undefined ? (
                        <span className="text-muted ml-2 text-xs font-normal">
                          (existing)
                        </span>
                      ) : null}
                    </p>
                    <p className="text-muted text-xs">
                      {room.checkIn} → {room.checkOut} · {room.guests} guest
                      {room.guests === 1 ? "" : "s"}
                    </p>
                  </li>
                ))}
              </ul>
            </CheckoutSection>
          ) : null}

          {cart.ferries.length > 0 ? (
            <CheckoutSection
              title={cart.ferries.length > 1 ? "Ferries" : "Ferry"}
              onEdit={() => editStep("ferry")}
            >
              <ul className="space-y-2">
                {cart.ferries.map((f, i) => (
                  <li key={`fc-${f.schedule.id}-${f.travelDate}-${i}`}>
                    <p className="text-base-color text-sm font-semibold">
                      {f.ferry.name}
                    </p>
                    <p className="text-muted text-xs">
                      {f.travelDate} · {f.schedule.departure_time} →{" "}
                      {f.schedule.arrival_time}
                      {f.schedule.departure_port
                        ? ` · ${f.schedule.departure_port} → ${f.schedule.arrival_port}`
                        : ""}
                    </p>
                    <p className="text-muted text-xs">
                      {f.passengers} passenger{f.passengers === 1 ? "" : "s"}
                    </p>
                  </li>
                ))}
              </ul>
            </CheckoutSection>
          ) : null}

          {cart.parkTickets.length > 0 ? (
            <CheckoutSection
              title={
                cart.parkTickets.length > 1
                  ? "Theme park tickets"
                  : "Theme park ticket"
              }
              onEdit={() => editStep("park-ticket")}
            >
              <ul className="space-y-2">
                {cart.parkTickets.map((ticket, i) => (
                  <li key={`pt-${ticket.park.id}-${ticket.visitDate}-${i}`}>
                    <p className="text-base-color text-sm font-semibold">
                      {ticket.park.name}
                    </p>
                    <p className="text-muted text-xs">
                      {ticket.visitDate} · {ticket.guests} guest
                      {ticket.guests === 1 ? "" : "s"}
                    </p>
                  </li>
                ))}
              </ul>
            </CheckoutSection>
          ) : null}

          {cart.parkActivities.length > 0 ? (
            <CheckoutSection
              title={
                cart.parkActivities.length > 1
                  ? "Park activities"
                  : "Park activity"
              }
              onEdit={() => editStep("park-activity")}
            >
              <ul className="space-y-2">
                {cart.parkActivities.map((act, i) => (
                  <li
                    key={`pa-${act.activity.id}-${act.schedule?.id ?? act.date ?? ""}-${i}`}
                  >
                    <p className="text-base-color text-sm font-semibold">
                      {act.activity.name}
                    </p>
                    <p className="text-muted text-xs">
                      {act.schedule
                        ? `${act.schedule.date} · ${act.schedule.start_time}`
                        : `${act.date ?? "—"} · all day`}{" "}
                      · {act.guests} guest{act.guests === 1 ? "" : "s"}
                    </p>
                  </li>
                ))}
              </ul>
            </CheckoutSection>
          ) : null}

          {cart.beachActivities.length > 0 ? (
            <CheckoutSection
              title={
                cart.beachActivities.length > 1
                  ? "Beach activities"
                  : "Beach activity"
              }
              onEdit={() => editStep("beach-activity")}
            >
              <ul className="space-y-2">
                {cart.beachActivities.map((act, i) => (
                  <li key={`ba-${act.schedule.id}-${i}`}>
                    <p className="text-base-color text-sm font-semibold">
                      {act.activity.name}
                    </p>
                    <p className="text-muted text-xs">
                      {act.schedule.activity_date} · {act.schedule.start_time} ·{" "}
                      {act.guests} guest{act.guests === 1 ? "" : "s"}
                    </p>
                  </li>
                ))}
              </ul>
            </CheckoutSection>
          ) : null}
        </div>

        <div className="border-base bg-surface mt-6 flex items-baseline justify-between gap-4 rounded-xl border p-5">
          <div>
            <p className="text-muted text-xs uppercase tracking-wider">
              Estimated total
            </p>
            <p className="text-primary mt-1 text-2xl font-bold">
              {formatMoney(totalEstimate)}
            </p>
            <p className="text-muted mt-1 text-xs">
              Final total may differ if availability changes between now and
              checkout.
            </p>
          </div>
          <button
            type="button"
            className="btn-accent inline-flex items-center gap-2"
            disabled={
              submitting || validating || errorIssues.length > 0
            }
            onClick={handleConfirm}
          >
            <Sparkles className="size-4" aria-hidden />
            {submitting ? "Confirming…" : "Confirm and book"}
          </button>
        </div>

        {tripWindow ? (
          <p className="text-muted mt-4 text-center text-xs">
            Trip window: {tripWindow.checkIn} → {tripWindow.checkOut}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CheckoutSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-base bg-surface flex items-start justify-between gap-4 rounded-xl border p-5">
      <div className="min-w-0 flex-1">
        <h3 className="text-base-color mb-2 text-sm font-semibold uppercase tracking-wide">
          {title}
        </h3>
        {children}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-primary shrink-0 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </button>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute allowedRoles={[CUSTOMER_ROLE]}>
      <BookingCartProvider>
        <CheckoutInner />
      </BookingCartProvider>
    </ProtectedRoute>
  );
}
