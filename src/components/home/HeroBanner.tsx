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
        src="/img/banner.avif"
        alt=""
        fill
        className="z-0 object-cover"
        sizes="100vw"
        priority
      />
      <div
        className="pointer-events-none absolute inset-0 z-1 bg-black/45"
        aria-hidden
      />

      <div
        className={`relative z-10 flex w-full items-center justify-center px-6 py-24 ${heroMinHeight}`}
      >
        <div className="mx-auto w-full max-w-7xl">
          <div
            id="hero-card-sentinel"
            className="pointer-events-none h-0 w-full"
            aria-hidden
          />
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h1 className="inline-flex flex-col leading-none text-primary drop-shadow-md">
              <span className="font-heading text-4xl font-semibold tracking-[0.32em] sm:text-5xl">
                MESOZOIC
              </span>
              <span className="mt-2 inline-flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-current opacity-90 sm:w-12" aria-hidden />
                <span className="font-heading text-xl font-semibold tracking-[0.26em] sm:text-2xl">
                  ISLE
                </span>
                <span className="h-px w-10 bg-current opacity-90 sm:w-12" aria-hidden />
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base text-white/90 drop-shadow-md sm:text-lg">
              Experience prehistoric adventures on our dinosaur-themed island.
            </p>

            <Button
              size="lg"
              onClick={handleBookAdventure}
              className="mt-10 h-12 gap-3 rounded-full bg-accent px-8 text-base font-heading font-semibold tracking-wide text-black shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:bg-accent/90 hover:shadow-xl hover:-translate-y-0.5"
            >
              Book Your Adventure
              <ArrowRight className="size-5 transition-transform duration-300 group-hover/button:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
