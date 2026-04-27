import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FALLBACK_IMAGE, resolveImage } from "@/lib/imageSrc";
import type { BeachActivity } from "@/types/booking";

interface BeachFeatureProps {
  activities: BeachActivity[];
}

export function BeachFeature({ activities }: BeachFeatureProps) {
  const featured = activities[0];
  const tiles = activities.slice(1, 4);
  const heroImage = (featured && resolveImage(featured)) || FALLBACK_IMAGE;

  return (
    <section className="bg-primary-deep border-base border-t py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <article>
            <p className="text-white/75 text-sm font-semibold uppercase tracking-[0.22em]">
              Discover
            </p>
            <h2 className="font-heading mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
              Where the sea calls.
            </h2>
            <div className="bg-accent mt-4 h-1 w-20 rounded-full" aria-hidden />
            <p className="mt-6 text-lg font-bold leading-relaxed text-white/90">
              Snorkel the reefs, race the wind on a board, or drift beneath
              sunset skies. The island&apos;s beaches are alive with guided
              adventures for every pace.
            </p>
            <Link
              href="/beach-activities"
              className="bg-accent mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 font-heading text-sm font-semibold uppercase tracking-wider text-black shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#efad24] hover:opacity-100 hover:shadow-xl active:-translate-y-0.5 active:bg-[#d48806] active:opacity-100 active:shadow-xl"
            >
              See All Beach Adventures
              <ArrowRight className="size-4" />
            </Link>

            <ul className="mt-10 grid grid-cols-3 gap-3">
              {tiles.length > 0
                ? tiles.map((tile) => (
                    <li
                      key={tile.id}
                      className="group/depth relative aspect-square overflow-hidden rounded-lg shadow-md perspective-[1000px]"
                    >
                      <img
                        src={resolveImage(tile) || FALLBACK_IMAGE}
                        alt={tile.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform transform-[scale(1.05)_rotateX(0deg)_rotateY(0deg)] group-hover/depth:transform-[scale(1.12)_rotateX(0.8deg)_rotateY(-2deg)] group-active/depth:transform-[scale(1.12)_rotateX(0.8deg)_rotateY(-2deg)]"
                      />
                      <div
                        className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"
                        aria-hidden
                      />
                      <span className="absolute bottom-2 left-2 right-2 truncate font-heading text-xs font-bold uppercase tracking-wider text-white drop-shadow">
                        {tile.name}
                      </span>
                    </li>
                  ))
                : Array.from({ length: 3 }).map((_, i) => (
                    <li
                      key={i}
                      className="group/depth aspect-square overflow-hidden rounded-lg shadow-md perspective-[1000px]"
                    >
                      <img
                        src={FALLBACK_IMAGE}
                        alt="Beach activity"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform transform-[scale(1.05)_rotateX(0deg)_rotateY(0deg)] group-hover/depth:transform-[scale(1.12)_rotateX(0.8deg)_rotateY(-2deg)] group-active/depth:transform-[scale(1.12)_rotateX(0.8deg)_rotateY(-2deg)]"
                      />
                    </li>
                  ))}
            </ul>
          </article>

          <div className="group/depth relative min-h-80 perspective-[1400px] lg:min-h-128">
            <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-xl">
              <img
                src={heroImage}
                alt="Beach adventures at Mesozoic Isle"
                className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform transform-[scale(1.06)_rotateX(0deg)_rotateY(0deg)] group-hover/depth:transform-[scale(1.14)_rotateX(1.2deg)_rotateY(-2.5deg)] group-active/depth:transform-[scale(1.14)_rotateX(1.2deg)_rotateY(-2.5deg)]"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-linear-to-tr from-white/0 via-white/0 to-white/0 opacity-0 transition-opacity duration-700 group-hover/depth:opacity-100 group-hover/depth:from-white/12 group-active/depth:opacity-100 group-active/depth:from-white/12"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
