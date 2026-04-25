import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PlanCta() {
  return (
    <section className="bg-primary-deep border-base border-t py-24 md:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-white/75 text-sm font-semibold uppercase tracking-[0.28em]">
          Plan Your Trip
        </p>
        <h2 className="font-heading mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
          Your island is waiting.
        </h2>
        <div
          className="bg-accent mx-auto mt-5 h-1 w-20 rounded-full"
          aria-hidden
        />
        <p className="mt-8 text-lg font-bold leading-relaxed text-white/90">
          Pick your stay, layer in the adventures, and step ashore ready for
          everything.
        </p>
        <Link
          href="/book"
          className="bg-accent mt-10 inline-flex h-12 items-center gap-3 rounded-full px-8 font-heading text-base font-semibold tracking-wide text-black shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#efad24] hover:opacity-100 hover:shadow-xl active:-translate-y-0.5 active:bg-[#d48806] active:opacity-100 active:shadow-xl"
        >
          Book Your Adventure
          <ArrowRight className="size-5" />
        </Link>
      </div>
    </section>
  );
}
