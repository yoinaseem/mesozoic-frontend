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
        className="pointer-events-none absolute inset-0 z-1 bg-gradient-to-r from-black/70 via-black/50 to-black/20"
        aria-hidden
      />

      <div
        className={`relative z-10 flex w-full items-center px-6 sm:px-10 lg:px-16 py-24 ${heroMinHeight}`}
      >
        <div className="max-w-7xl w-full mx-auto">
          <div
            id="hero-card-sentinel"
            className="pointer-events-none h-0 w-full"
            aria-hidden
          />
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] font-heading font-semibold text-primary drop-shadow-md">
              Welcome to
            </p>

            <h1 className="mt-3 font-heading font-bold leading-[0.95] drop-shadow-xl">
              <span className="block text-6xl sm:text-7xl lg:text-8xl text-primary">
                MESOZOIC
              </span>
              <span className="block text-6xl sm:text-7xl lg:text-8xl text-accent">
                ISLE
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base sm:text-lg text-white/85 drop-shadow-md">
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
