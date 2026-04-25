import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OurTeamCarousel } from "@/components/about/OurTeamCarousel";

export const metadata: Metadata = {
  title: "About Us | Mesozoic Isle",
  description: "Learn about Mesozoic Isle, our story, mission, and guest experience.",
};

export default function AboutPage() {
  return (
    <div className="bg-base min-h-full">
      <section
        className="relative -mt-16 bg-primary/5 pt-44 md:pt-52"
        aria-label="Our story"
      >
        <div className="mx-auto w-full max-w-7xl px-6 pb-20 md:pb-28">
          <div className="flex items-center gap-3">
            <span className="h-[2px] w-14 bg-accent" aria-hidden />
            <p className="text-accent text-base font-bold uppercase tracking-[0.32em]">
              Our Story
            </p>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <h1 className="font-heading text-primary text-3xl font-semibold leading-[1.15] md:text-4xl lg:text-5xl">
              An island story, built for{" "}
              <span className="text-primary-deep font-normal italic">
                wonder &amp; adventure.
              </span>
            </h1>

            <div className="space-y-5 lg:pt-2">
              <p className="text-base-color text-base leading-relaxed md:text-lg">
                Mesozoic Isle began with a simple idea — a destination where
                nature, adventure, and comfort thrive together in one seamless
                journey. Stays, attractions, and curated activities live on a
                single island, so you never have to choose between excitement
                and ease.
              </p>
              <p className="text-base-color text-base leading-relaxed md:text-lg">
                Every experience is designed for memorable moments — built for
                wonder, for families, and for adventure seekers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-base border-t bg-base py-20 md:py-28"
        aria-label="Our vision and mission"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-[2px] w-14 bg-accent" aria-hidden />
              <p className="text-accent text-base font-bold uppercase tracking-[0.32em]">
                Vision &amp; Mission
              </p>
            </div>

            <h2 className="font-heading text-primary mt-8 text-3xl font-semibold leading-[1.15] md:text-4xl lg:text-5xl">
              What island living{" "}
              <span className="text-primary-deep font-normal italic">
                means to us.
              </span>
            </h2>

            <div className="mt-8 space-y-5">
              <p className="text-base-color text-base leading-relaxed md:text-lg">
                To be the world&apos;s most memorable adventure island — a
                place where every guest experiences wonder, safety, and
                world-class hospitality in one seamless journey.
              </p>
              <p className="text-base-color text-base leading-relaxed md:text-lg">
                We deliver curated experiences that blend thrill, comfort, and
                care. From first booking to final checkout, every touchpoint
                is transparent, guest-first, and built for memorable moments.
              </p>
            </div>
          </div>

          <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 lg:aspect-5/4">
            <Image
              src="/img/banner.avif"
              alt=""
              aria-hidden
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>
      </section>

      <section
        className="relative border-base border-t bg-surface py-20 md:py-28"
        aria-label="Our team"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-3">
            <span className="h-[2px] w-14 bg-accent" aria-hidden />
            <p className="text-accent text-base font-bold uppercase tracking-[0.32em]">
              Our Team
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-end lg:gap-12">
            <h2 className="font-heading text-primary max-w-3xl text-3xl font-semibold leading-[1.15] md:text-4xl lg:text-5xl">
              The people behind{" "}
              <span className="text-primary-deep font-normal italic">
                every island moment.
              </span>
            </h2>
            <p className="text-base-color text-base leading-relaxed md:text-lg">
              A small, dedicated crew that designs, hosts, and cares for every
              stay — from first booking to final farewell.
            </p>
          </div>

          <div className="mt-14">
            <OurTeamCarousel />
          </div>
        </div>

        <div
          className="from-surface pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r to-transparent md:w-20"
          aria-hidden
        />
        <div
          className="from-surface pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l to-transparent md:w-20"
          aria-hidden
        />
      </section>

      <section
        className="border-base border-t bg-base py-20 md:py-28"
        aria-label="Our values"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-3">
            <span className="h-[2px] w-14 bg-accent" aria-hidden />
            <p className="text-accent text-base font-bold uppercase tracking-[0.32em]">
              Our Values
            </p>
          </div>

          <h2 className="font-heading text-primary mt-8 max-w-3xl text-3xl font-semibold leading-[1.15] md:text-4xl lg:text-5xl">
            Six island{" "}
            <span className="text-primary-deep font-normal italic">
              commitments.
            </span>
          </h2>

          <ul className="bg-sage/60 mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl ring-1 ring-black/5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((value) => (
              <li
                key={value.title}
                className="bg-base flex flex-col gap-5 px-7 py-9 md:px-8 md:py-10"
              >
                <span
                  aria-hidden
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${value.iconChip}`}
                >
                  <PlaceholderValueIcon />
                </span>
                <div>
                  <h3 className="font-heading text-primary-deep text-xl font-semibold">
                    {value.title}
                  </h3>
                  <p className="text-base-color mt-3 text-base leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="border-base border-t bg-surface py-20 md:py-28"
        aria-label="Plan your visit"
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-heading text-primary text-3xl font-semibold leading-[1.15] md:text-4xl">
            Ready to explore{" "}
            <span className="text-primary-deep font-normal italic">
              The Kingdom?
            </span>
          </h2>
          <p className="text-base-color mx-auto mt-5 max-w-xl text-base leading-relaxed md:text-lg">
            Book your park activity and experience the wonders of Mesozoic Isle
            up close.
          </p>
          <div className="mt-8">
            <Link
              href="/book"
              className="group bg-accent ring-black/5 inline-flex items-center gap-2 rounded-lg px-8 py-3 text-base font-semibold text-black shadow-sm ring-1 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-0 active:shadow-sm"
            >
              Book Your Activity
              <ArrowRight
                aria-hidden
                className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

type Value = {
  title: string;
  description: string;
  iconChip: string;
};

const VALUES: Value[] = [
  {
    title: "Authentic Hospitality",
    description:
      "Every guest welcomed like family — from the first hello to the long goodbye.",
    iconChip: "bg-primary/10 text-primary",
  },
  {
    title: "Curated Adventure",
    description:
      "From reef dives to sunset trails, every experience is shaped by hand and led with care.",
    iconChip: "bg-accent/15 text-accent",
  },
  {
    title: "Island Stewardship",
    description:
      "We protect the reef, the forest, and the community that hosts every visit.",
    iconChip: "bg-lagoon/15 text-lagoon",
  },
  {
    title: "Memorable Moments",
    description:
      "We design for the photo you'll print, not the one you'll scroll past.",
    iconChip: "bg-lagoon/15 text-lagoon",
  },
  {
    title: "Guest-First Service",
    description:
      "One team, one promise — every request held, anticipated, and answered fully.",
    iconChip: "bg-accent/15 text-accent",
  },
  {
    title: "Safety & Trust",
    description:
      "Trained crews, transparent pricing, and total peace of mind across every stay.",
    iconChip: "bg-primary/10 text-primary",
  },
];

function PlaceholderValueIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z" />
    </svg>
  );
}
