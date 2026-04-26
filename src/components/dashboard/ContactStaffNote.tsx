import { Mail, Phone } from "lucide-react";

// Static contact info. Real numbers/email come from the live deploy
// configuration; these are placeholders so the UI doesn't ship empty.
const RESERVATIONS_EMAIL = "reservations@mesozoicisle.com";
const RESERVATIONS_PHONE = "+1 (555) 123-4567";
const RESERVATIONS_HOURS = "9am – 9pm island time";

export function ContactStaffNote() {
  return (
    <section className="border-base bg-surface flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
      <header>
        <h3 className="text-base-color text-base font-semibold">
          Need to cancel or change a booking?
        </h3>
        <p className="text-muted text-xs">
          Cancellations are handled by our reservations desk — drop us a line
          and we&rsquo;ll take care of it.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={`mailto:${RESERVATIONS_EMAIL}`}
          className="border-base hover:border-primary text-base-color flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors"
        >
          <Mail className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-muted text-xs uppercase tracking-wide">Email</p>
            <p className="truncate font-medium">{RESERVATIONS_EMAIL}</p>
          </div>
        </a>
        <a
          href={`tel:${RESERVATIONS_PHONE.replace(/[^+\d]/g, "")}`}
          className="border-base hover:border-primary text-base-color flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors"
        >
          <Phone className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-muted text-xs uppercase tracking-wide">Phone</p>
            <p className="font-medium">{RESERVATIONS_PHONE}</p>
            <p className="text-muted text-xs">{RESERVATIONS_HOURS}</p>
          </div>
        </a>
      </div>
    </section>
  );
}
