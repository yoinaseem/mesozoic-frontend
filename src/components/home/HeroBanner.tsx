"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const heroMinHeight = "min-h-[calc(100dvh+4rem)]";

export default function HeroBanner() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleBookAdventure = () => {
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname ?? "/");
      router.push(`/login?next=${next}`);
    }
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
        className="pointer-events-none absolute inset-0 z-1 bg-black/50"
        aria-hidden
      />

      <div
        className={`relative z-10 flex w-full items-center justify-center px-6 py-24 ${heroMinHeight}`}
      >
        <div className="max-w-7xl w-full text-center">
          <div
            id="hero-card-sentinel"
            className="pointer-events-none h-0 w-full"
            aria-hidden
          />
          <div className="card mx-auto max-w-3xl">
            <h1 className="text-5xl font-bold text-primary">
              Welcome to Mesozoic Isle
            </h1>

            <p className="text-muted mt-4 max-w-xl mx-auto text-base">
              Experience prehistoric adventures on our dinosaur-themed island.
            </p>

            <button
              type="button"
              className="btn-accent mt-8"
              onClick={handleBookAdventure}
            >
              Book Your Adventure
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
