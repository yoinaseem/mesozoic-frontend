import Image from "next/image";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80&auto=format&fit=crop";

const heroMinHeight = "min-h-screen";

export default function HeroBanner() {
  return (
    <section
      className={`-mt-16 relative w-full overflow-hidden ${heroMinHeight}`}
      aria-label="Welcome"
    >
      <Image
        src={HERO_IMAGE}
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

            <button type="button" className="btn-accent mt-8">
              Book Your Adventure
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
