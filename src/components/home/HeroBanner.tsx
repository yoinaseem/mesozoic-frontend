"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

const heroMinHeight = "min-h-[calc(100dvh+4rem)]";

export default function HeroBanner() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleBookAdventure = () => {
    if (!isAuthenticated) {
      router.push("/login");
    }
    router.push("/book");
  };

  return (
    <section
      className={`-mt-16 relative w-full overflow-hidden ${heroMinHeight}`}
      aria-label="Welcome"
    >
      <Image
        src="/img/hero-home-dark.png"
        alt=""
        fill
        className="z-0 object-cover"
        sizes="100vw"
        priority
      />

      {/* Vertical gradient: darker at top (under nav) + bottom (under copy), lighter through the middle. */}
      <div
        className="pointer-events-none absolute inset-0 z-1 bg-linear-to-b from-black/70 via-black/30 to-black/80 dark:from-black/45 dark:via-black/15 dark:to-black/50"
        aria-hidden
      />

      <div
        className={`relative z-10 flex w-full items-center justify-start px-6 py-24 ${heroMinHeight}`}
      >
        <div className="mx-auto w-full max-w-7xl">
          <div
            id="hero-card-sentinel"
            className="pointer-events-none h-0 w-full"
            aria-hidden
          />
          <div className="flex max-w-3xl flex-col items-start text-left">
            <div className="flex w-fit flex-col">
              <p className="font-heading text-left text-xs font-semibold uppercase tracking-[0.42em] text-accent drop-shadow-md sm:text-sm">
                Welcome to a Lost World
              </p>

              <h1 className="mt-5 inline-flex flex-col leading-none text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]">
                <span className="font-heading text-5xl font-bold tracking-[0.32em] sm:text-7xl">
                  MESOZOIC
                </span>
                <span className="mt-3 inline-flex self-center items-center justify-center gap-3">
                  <span
                    className="h-px w-10 bg-accent opacity-90 sm:w-16"
                    aria-hidden
                  />
                  <span
                    className="font-heading text-2xl font-semibold tracking-[0.32em] sm:text-3xl"
                  >
                    ISLE
                  </span>
                  <span
                    className="h-px w-10 bg-accent opacity-90 sm:w-16"
                    aria-hidden
                  />
                </span>
              </h1>
            </div>

            <p className="mt-8 max-w-xl text-base font-medium text-white/95 drop-shadow-md sm:text-lg">
              Where ancient giants still roam and untamed shores await — step
              into prehistoric wonder on our island like no other.
            </p>

            <Button
              size="lg"
              onClick={handleBookAdventure}
              className="mt-10 h-12 gap-3 rounded-full bg-accent px-8 text-base font-heading font-semibold tracking-wide text-black shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#efad24] hover:shadow-xl active:-translate-y-0.5 active:bg-[#d48806] active:shadow-xl"
            >
              Book Your Adventure
              <ArrowRight className="size-5 transition-transform duration-300 group-hover/button:translate-x-1 group-active/button:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>

    </section>
  );
}
