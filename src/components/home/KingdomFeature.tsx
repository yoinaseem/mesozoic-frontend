import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ParkActivity } from "@/types/booking";

const FALLBACK = "/img/banner.avif";

interface KingdomFeatureProps {
  activities: ParkActivity[];
}

export function KingdomFeature({ activities }: KingdomFeatureProps) {
  const heroImage = activities.find((a) => a.image)?.image || FALLBACK;

  return (
    <section className="bg-base border-base border-t py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
          <div className="group/depth relative min-h-80 perspective-[1400px] lg:min-h-120">
            <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-xl">
              <img
                src={heroImage}
                alt="Inside The Kingdom at Mesozoic Isle"
                className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform transform-[scale(1.06)_rotateX(0deg)_rotateY(0deg)] group-hover/depth:transform-[scale(1.14)_rotateX(1.2deg)_rotateY(2.5deg)] group-active/depth:transform-[scale(1.14)_rotateX(1.2deg)_rotateY(2.5deg)]"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-linear-to-tr from-white/0 via-white/0 to-white/0 opacity-0 transition-opacity duration-700 group-hover/depth:opacity-100 group-hover/depth:from-white/12 group-active/depth:opacity-100 group-active/depth:from-white/12"
                aria-hidden
              />
            </div>
            <div className="bg-accent absolute -bottom-4 -left-4 hidden rounded-full px-5 py-2 font-heading text-xs font-bold uppercase tracking-wider text-black shadow-lg lg:block">
              Now Open
            </div>
          </div>

          <article>
            <div className="flex items-center gap-3">
              <p className="text-primary text-sm font-semibold uppercase tracking-[0.22em]">
                Explore
              </p>
              <span className="bg-primary h-px flex-1" aria-hidden />
            </div>
            <h2 className="font-heading text-primary mt-6 text-4xl font-bold leading-tight md:text-5xl">
              Step into the Kingdom.
            </h2>
            <div
              className="bg-primary mt-4 h-1 w-20 rounded-full"
              aria-hidden
            />
            <p className="text-base-color mt-6 text-lg font-bold leading-relaxed">
              Beyond the resorts lies a world unlike any other. Walk among the
              ancients, board guided expeditions, and witness the wonders that
              gave the island its name.
            </p>
            <p className="text-base-color mt-4 text-lg font-bold leading-relaxed">
              Every encounter is led by experts and engineered for safety —
              bring the family, bring the wonder.
            </p>
            <Link
              href="/activities"
              className="bg-primary mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-deep hover:opacity-100 hover:underline hover:underline-offset-4 hover:shadow-xl active:-translate-y-0.5 active:bg-primary-deep active:opacity-100 active:underline active:underline-offset-4 active:shadow-xl"
            >
              Discover The Kingdom
              <ArrowRight className="size-4" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
