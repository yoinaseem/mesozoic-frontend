import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About Us | Mesozoic Isle",
  description: "Learn about Mesozoic Isle, our story, mission, and guest experience.",
};

export default function AboutPage() {
  return (
    <div className="bg-base min-h-full">
      <section className="border-base border-b bg-base pt-36 pb-28">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="font-heading text-primary text-5xl font-bold tracking-wide md:text-6xl">
            About <span className="text-primary">Us</span>
          </h1>
          <p className="text-base-color mt-6 text-base leading-relaxed font-bold max-w-3xl">
            Building unforgettable island adventures through hospitality,
            collaboration, and guest-first experiences.
          </p>
        </div>
      </section>

      <section className="bg-primary/10 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
            <article>
              <p className="text-primary text-base font-semibold uppercase tracking-[0.22em]">
                Our Story
              </p>
              <h2 className="font-heading text-primary mt-6 text-4xl font-bold leading-tight md:text-5xl">
                Where It All Began
              </h2>
              <div className="bg-primary mt-4 h-1 w-20 rounded-full" aria-hidden />
              <p className="text-base-color mt-6 text-lg leading-relaxed font-bold">
                Mesozoic Isle began with a simple but powerful idea: create a
                destination where nature, adventure, and comfort can thrive
                together.
              </p>
              <p className="text-base-color mt-6 text-lg leading-relaxed font-bold">
                For too long, vacations forced travelers to choose between
                excitement and ease. We built Mesozoic Isle to bring both into
                one seamless journey with accommodations, attractions, and
                curated activities all in one place.
              </p>
              <p className="text-base-color mt-6 text-lg leading-relaxed font-bold">
                Every experience is designed around memorable moments and smooth
                planning so guests can focus on exploration instead of logistics.
              </p>
              <p className="text-base-color mt-6 text-lg leading-relaxed font-bold">
                This is not just a getaway. This is an island story built for
                wonder, for families, and for adventure seekers.
              </p>
            </article>

            <div className="relative min-h-80 overflow-hidden rounded-xl lg:min-h-0">
              <Image
                src="/img/banner.avif"
                alt="Guests enjoying Mesozoic Isle experience"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-base border-t bg-base py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-2">
          <article>
            <p className="text-primary text-base font-semibold uppercase tracking-[0.22em]">
              Our Vision
            </p>
            <h3 className="font-heading text-primary mt-4 text-3xl font-bold leading-tight md:text-4xl">
              To be the world&apos;s most memorable adventure island destination
            </h3>
            <div className="bg-primary mt-4 h-1 w-20 rounded-full" aria-hidden />
            <p className="text-base-color mt-6 text-lg leading-relaxed font-bold">
              We envision a place where every guest can experience wonder, safety,
              and world-class hospitality in one seamless journey.
            </p>
          </article>

          <article>
            <p className="text-primary text-base font-semibold uppercase tracking-[0.22em]">
              Our Mission
            </p>
            <h3 className="font-heading text-primary mt-4 text-3xl font-bold leading-tight md:text-4xl">
              Deliver curated experiences that blend thrill, comfort, and care
            </h3>
            <div className="bg-primary mt-4 h-1 w-20 rounded-full" aria-hidden />
            <p className="text-base-color mt-6 text-lg leading-relaxed font-bold">
              From booking to checkout, our mission is to provide transparent,
              guest-first experiences across accommodation, attractions, and
              guided island activities.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
