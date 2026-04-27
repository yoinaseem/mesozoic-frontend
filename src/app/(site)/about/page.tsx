import type { Metadata } from "next";
import Image from "next/image";
import {
  Camera,
  Compass,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { OurTeamCarousel } from "@/components/about/OurTeamCarousel";
import { PlanCta } from "@/components/home/PlanCta";

export const metadata: Metadata = {
  title: "About Us | Mesozoic Isle",
  description:
    "Learn about Mesozoic Isle, our story, mission, and guest experience.",
};

export default function AboutPage() {
  return (
    <div className="bg-base min-h-full">
      <section
        className="relative -mt-16 overflow-hidden bg-base bg-linear-to-b from-primary/10 to-transparent dark:from-transparent pb-7 pt-22 md:pb-8 md:pt-26"
        aria-label="About us hero"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/70 via-surface to-base dark:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl md:h-96 md:w-96 dark:hidden"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[34dvh] w-full max-w-7xl items-center px-6 md:min-h-[38dvh]">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-heading text-black dark:text-[#fbbf24] text-xs font-semibold uppercase tracking-[0.42em] sm:text-sm">
              ABOUT US
            </p>

            <h1 className="text-primary mt-5 inline-flex flex-col leading-none">
              <span className="font-heading text-5xl font-bold tracking-[0.2em] sm:text-6xl md:text-7xl">
                MESOZOIC ISLE
              </span>
              <span className="mt-4 inline-flex items-center justify-center gap-3">
                <span
                  className="h-px w-12 bg-accent opacity-90 sm:w-16"
                  aria-hidden
                />
                <span className="font-heading text-black dark:text-[#fbbf24] text-sm font-semibold tracking-[0.34em] sm:text-base">
                  AN ISLAND STORY
                </span>
                <span
                  className="h-px w-12 bg-accent opacity-90 sm:w-16"
                  aria-hidden
                />
              </span>
            </h1>
          </div>
        </div>
      </section>

      <section
        className="border-base border-t bg-primary-deep py-14 md:py-16"
        aria-label="Our story"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-3 lg:gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div className="group/story relative aspect-4/3 w-full overflow-hidden rounded-3xl border border-white/20 shadow-md lg:aspect-5/6">
              <Image
                // UPDATE
                src="/img/about-our-story.png"
                alt="Island Arrival"
                fill
                sizes="(min-width: 1024px) 32vw, 100vw"
                className="object-center transition-transform duration-700 ease-out group-hover/story:scale-110 group-active/story:scale-110 motion-reduce:transition-none motion-reduce:transform-none"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent"
                aria-hidden
              />
            </div>

            <div className="lg:px-2">
              <p className="text-white/75 text-sm font-semibold uppercase tracking-[0.28em]">
                Our Story
              </p>
              <h2 className="font-heading mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
                An island story, built for{" "}
                <span className="text-accent font-normal italic">
                  wonder &amp; adventure.
                </span>
              </h2>
              <div
                className="mt-5 h-1 w-20 rounded-full bg-accent"
                aria-hidden
              />

              <div className="mt-6 space-y-5 text-base leading-relaxed text-white/90 md:text-lg">
                <p>
                  Mesozoic Isle began with a simple idea - a destination where
                  nature, adventure, and comfort thrive together in one seamless
                  journey. Stays, attractions, and curated activities live on a
                  single island, so you never have to choose between excitement
                  and ease.
                </p>
                <p>
                  Every experience is designed for memorable moments - built for
                  wonder, for families, and for adventure seekers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-base border-t bg-base py-20 md:py-24"
        aria-label="Our vision and mission"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="text-primary text-sm font-semibold uppercase tracking-[0.28em]">
              Vision &amp; Mission
            </p>
            <h2 className="font-heading text-primary mt-6 text-4xl font-bold leading-tight md:text-5xl">
              What island living{" "}
              <span className="text-primary-deep dark:text-emerald-300 font-normal ">
                means to us.
              </span>
            </h2>
            <div
              className="bg-primary mt-5 h-1 w-20 rounded-full"
              aria-hidden
            />

            <div className="mt-8 space-y-5">
              <p className="text-base-color text-base leading-relaxed md:text-lg">
                To be the world&apos;s most memorable adventure island — a place
                where every guest experiences wonder, safety, and world-class
                hospitality in one seamless journey.
              </p>
              <p className="text-base-color text-base leading-relaxed md:text-lg">
                We deliver curated experiences that blend thrill, comfort, and
                care. From first booking to final checkout, every touchpoint is
                transparent, guest-first, and built for memorable moments.
              </p>
            </div>
          </div>

          <div className="group/depth relative aspect-4/3 w-full perspective-[1400px] lg:aspect-5/4">
            <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
              <Image
                // UPDATE
                src="/img/about-vision-mission.png"
                alt="A panoramic glimpse of Mesozoic Isle"
                fill
                className="object-cover transition-transform duration-700 ease-out will-change-transform transform-[scale(1.06)_rotateX(0deg)_rotateY(0deg)] group-hover/depth:transform-[scale(1.14)_rotateX(1.2deg)_rotateY(2.5deg)] group-active/depth:transform-[scale(1.14)_rotateX(1.2deg)_rotateY(2.5deg)] motion-reduce:transition-none motion-reduce:transform-none"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-linear-to-tr from-white/0 via-white/0 to-white/0 opacity-0 transition-opacity duration-700 group-hover/depth:opacity-100 group-hover/depth:from-white/12 group-active/depth:opacity-100 group-active/depth:from-white/12 motion-reduce:transition-none"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative border-base border-t bg-primary-deep py-20 md:py-24"
        aria-label="Our team"
      >
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-white/75 text-sm font-semibold uppercase tracking-[0.28em]">
            Our Team
          </p>
          <div className="mt-5 h-1 w-20 rounded-full bg-accent" aria-hidden />

          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-end lg:gap-12">
            <h2 className="font-heading max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl">
              The people behind{" "}
              <span className="text-accent font-normal ">
                every island moment.
              </span>
            </h2>
            <p className="text-base text-white/90 leading-relaxed md:text-lg">
              A small, dedicated crew that designs, hosts, and cares for every
              stay — from first booking to final farewell.
            </p>
          </div>

          <div className="mt-14">
            <OurTeamCarousel />
          </div>
        </div>

        <div
          className="from-primary-deep pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r to-transparent md:w-20"
          aria-hidden
        />
        <div
          className="from-primary-deep pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l to-transparent md:w-20"
          aria-hidden
        />
      </section>

      <section
        id="values"
        className="border-base border-t bg-base py-20 md:py-24"
        aria-label="Our values"
      >
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-primary text-sm font-semibold uppercase tracking-[0.28em]">
            Our Values
          </p>

          <h2 className="font-heading text-primary mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Six island{" "}
            <span className="text-primary-deep dark:text-emerald-300 font-normal ">
              commitments.
            </span>
          </h2>
          <div className="bg-primary mt-5 h-1 w-20 rounded-full" aria-hidden />

          <ul className="bg-sage/30 dark:bg-white/12 mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl ring-1 ring-black/8 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map(({ title, description, icon: Icon }) => (
              <li
                key={title}
                className="group/value bg-surface border-base dark:bg-black dark:border-black dark:text-white flex flex-col gap-5 border px-7 py-9 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:-translate-y-1 active:shadow-lg motion-reduce:transition-none motion-reduce:transform-none md:px-8 md:py-10"
              >
                <span
                  aria-hidden
                  className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover/value:scale-110 group-hover/value:-rotate-3 group-active/value:scale-110 group-active/value:-rotate-3 motion-reduce:transition-none motion-reduce:transform-none"
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <h3 className="font-heading text-primary-deep dark:text-emerald-300 text-xl font-semibold">
                    {title}
                  </h3>
                  <p className="text-base-color mt-3 text-base leading-relaxed">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <PlanCta />
    </div>
  );
}

type Value = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const VALUES: Value[] = [
  {
    icon: HeartHandshake,
    title: "Authentic Hospitality",
    description:
      "Every guest welcomed like family — from the first hello to the long goodbye.",
  },
  {
    icon: Compass,
    title: "Curated Adventure",
    description:
      "From reef dives to sunset trails, every experience is shaped by hand and led with care.",
  },
  {
    icon: Leaf,
    title: "Island Stewardship",
    description:
      "We protect the reef, the forest, and the community that hosts every visit.",
  },
  {
    icon: Camera,
    title: "Memorable Moments",
    description:
      "We design for the photo you'll print, not the one you'll scroll past.",
  },
  {
    icon: Sparkles,
    title: "Guest-First Service",
    description:
      "One team, one promise — every request held, anticipated, and answered fully.",
  },
  {
    icon: ShieldCheck,
    title: "Safety & Trust",
    description:
      "Trained crews, transparent pricing, and total peace of mind across every stay.",
  },
];
