import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Hotel } from "@/types/booking";

const FALLBACK = "/img/banner.avif";

interface AccommodationFeatureProps {
  hotels: Hotel[];
}

export function AccommodationFeature({ hotels }: AccommodationFeatureProps) {
  const withImages = hotels.filter((h) => h.image);
  const primaryImage = withImages[0]?.image || hotels[0]?.image || FALLBACK;
  const secondaryImage =
    withImages[1]?.image || hotels[1]?.image || primaryImage;

  return (
    <section className="bg-primary-deep border-base border-t py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <article>
            <p className="text-white/75 text-sm font-semibold uppercase tracking-[0.22em]">
              Stay
            </p>
            <h2 className="font-heading mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
              Rest among the trees.
            </h2>
            <div
              className="bg-accent mt-4 h-1 w-20 rounded-full"
              aria-hidden
            />
            <p className="mt-6 text-lg font-bold leading-relaxed text-white/90">
              Wake to mist-soaked canopies and ocean horizons. Our island hotels
              range from intimate jungle lodges to grand reef-side retreats,
              each with rooms designed for slow mornings and easy adventure.
            </p>
            <p className="mt-4 text-lg font-bold leading-relaxed text-white/90">
              Pick the home for your stay and we&apos;ll unlock the rest of your
              trip from there.
            </p>
            <Link
              href="/accommodation"
              className="bg-accent mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 font-heading text-sm font-semibold uppercase tracking-wider text-black shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#efad24] hover:opacity-100 hover:shadow-xl active:-translate-y-0.5 active:bg-[#d48806] active:opacity-100 active:shadow-xl"
            >
              Browse Hotels
              <ArrowRight className="size-4" />
            </Link>
          </article>

          <div className="relative min-h-80 perspective-[1400px] lg:min-h-112">
            <div className="group/main absolute inset-0 overflow-hidden rounded-2xl shadow-xl">
              <img
                src={primaryImage}
                alt="Featured accommodation at Mesozoic Isle"
                className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform transform-[scale(1.06)_rotateX(0deg)_rotateY(0deg)] group-hover/main:transform-[scale(1.14)_rotateX(1.2deg)_rotateY(-2.5deg)] group-active/main:transform-[scale(1.14)_rotateX(1.2deg)_rotateY(-2.5deg)]"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-linear-to-tr from-white/0 via-white/0 to-white/0 opacity-0 transition-opacity duration-700 group-hover/main:opacity-100 group-hover/main:from-white/12 group-active/main:opacity-100 group-active/main:from-white/12"
                aria-hidden
              />
            </div>
            <div className="group/inset bg-primary-deep absolute -bottom-6 -left-6 hidden h-40 w-56 rounded-xl p-1.5 shadow-2xl transition-transform duration-700 ease-out will-change-transform transform-[scale(1)_rotateX(0deg)_rotateY(0deg)] group-hover/inset:transform-[scale(1)_rotateX(0.8deg)_rotateY(-3deg)] group-active/inset:transform-[scale(1)_rotateX(0.8deg)_rotateY(-3deg)] lg:block">
              <div className="h-full w-full overflow-hidden rounded-lg">
                <img
                  src={secondaryImage}
                  alt="Room interior"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform transform-[scale(1.06)_rotateX(0deg)_rotateY(0deg)] group-hover/inset:transform-[scale(1.14)_rotateX(0.8deg)_rotateY(-2deg)] group-active/inset:transform-[scale(1.14)_rotateX(0.8deg)_rotateY(-2deg)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
