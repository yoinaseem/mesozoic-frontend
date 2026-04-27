"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PLACEHOLDER =
  "https://sites.duke.edu/dek23/wp-content/themes/koji/assets/images/default-fallback-image.png";

const SLIDES = [
  {
    image: PLACEHOLDER,
    overline: "Stay",
    title: "Wake among the canopies",
    caption: "Treetop sanctuaries where mornings begin with mist and birdsong.",
  },
  {
    image: PLACEHOLDER,
    overline: "Explore",
    title: "Walk with giants",
    caption:
      "Step into the Kingdom and meet the ancients on guided expeditions.",
  },
  {
    image: PLACEHOLDER,
    overline: "Discover",
    title: "Where reefs meet wonder",
    caption: "Drift through living color on the island's shimmering shores.",
  },
  {
    image: PLACEHOLDER,
    overline: "Unwind",
    title: "Sunset on ancient shores",
    caption: "End the day where time stands still and the sky catches fire.",
  },
];

export function MomentsCarousel() {
  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    autoplay.current,
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi]);

  return (
    <section
      className="bg-primary-deep border-base border-t pt-14 md:pt-16"
      aria-label="Moments on the island"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-white/75 text-sm font-semibold uppercase tracking-[0.28em]">
            Moments on the Isle
          </p>
          <h2 className="font-heading mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
            A glimpse of your journey.
          </h2>
          <div
            className="bg-accent mx-auto mt-5 h-1 w-20 rounded-full"
            aria-hidden
          />
        </div>
      </div>

      <div className="relative mt-10">
        <div className="overflow-hidden shadow-2xl" ref={emblaRef}>
          <div className="flex">
            {SLIDES.map((slide, i) => {
              return (
                <div
                  key={i}
                  className="relative min-w-0 flex-[0_0_100%]"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${SLIDES.length}`}
                >
                  <div className="relative h-[60vh] min-h-104 w-full md:h-[72vh]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-black/40 dark:bg-black/20"
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-5 md:bottom-10">
                      <div className="mx-auto max-w-7xl px-4 md:px-10">
                        <div className="w-full max-w-xl p-5 md:w-[40%] md:p-7">
                          <p className="font-heading text-xs font-semibold uppercase tracking-[0.32em] text-accent drop-shadow-md md:text-sm">
                            {slide.overline}
                          </p>
                          <h3 className="font-heading mt-3 text-2xl font-bold leading-tight text-white drop-shadow-lg md:text-4xl">
                            {slide.title}
                          </h3>
                          <p className="mt-3 text-sm font-medium text-white/90 drop-shadow md:text-base">
                            {slide.caption}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous slide"
          className="group absolute bottom-0 left-0 top-0 inline-flex w-20 items-center justify-start bg-transparent pl-3 md:w-28 md:pl-5"
        >
          <ChevronLeft
            className="size-8 text-white/35 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition-all duration-300 group-hover:text-white/95 group-active:text-white/95 md:size-10"
            strokeWidth={1.8}
          />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next slide"
          className="group absolute bottom-0 right-0 top-0 inline-flex w-20 items-center justify-end bg-transparent pr-3 md:w-28 md:pr-5"
        >
          <ChevronRight
            className="size-8 text-white/35 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition-all duration-300 group-hover:text-white/95 group-active:text-white/95 md:size-10"
            strokeWidth={1.8}
          />
        </button>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2 px-6 md:bottom-6"
          role="tablist"
          aria-label="Carousel pagination"
        >
          {SLIDES.map((_, i) => {
            const active = i === selectedIndex;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={`pointer-events-auto h-2 rounded-full transition-all duration-300 ${
                  active
                    ? "bg-white w-8 shadow-[0_1px_8px_rgba(0,0,0,0.45)]"
                    : "bg-white/45 w-2 hover:bg-white/70 active:bg-white/70"
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
