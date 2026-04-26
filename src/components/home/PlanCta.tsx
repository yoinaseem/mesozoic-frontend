import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PlanCta() {
  return (
    <section className="border-base border-t bg-primary-deep py-20 md:py-24" aria-label="Plan your visit">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-white/75 text-sm font-semibold uppercase tracking-[0.28em]">
            Plan Your Visit
          </p>
          <h2 className="font-heading mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
            Ready to explore{" "}
            <span className="text-accent font-normal italic">
              The Kingdom?
            </span>
          </h2>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" aria-hidden />
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
            Book your park activity and experience the wonders of Mesozoic Isle
            up close.
          </p>
          <div className="mt-8">
            <Link
              href="/book"
              className="bg-accent inline-flex h-12 items-center gap-3 rounded-full px-8 font-heading text-base font-semibold tracking-wide text-black shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#efad24] hover:opacity-100 hover:shadow-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary-deep active:-translate-y-0.5 active:bg-[#d48806] active:opacity-100 active:shadow-xl motion-reduce:transition-none motion-reduce:transform-none"
              >
              Book Your Activity
              <ArrowRight
                aria-hidden
                className="h-5 w-5 transition-transform duration-300 ease-out motion-reduce:transition-none"
              />
            </Link>
          </div>
        </div>
      </section>
  );
}
