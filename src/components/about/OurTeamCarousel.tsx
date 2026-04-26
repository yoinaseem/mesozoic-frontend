"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  initials: string;
};

const TEAM: TeamMember[] = [
  {
    name: "Ayesha Khan",
    role: "Founder & CEO",
    bio: "Steers the island vision and keeps every guest stay rooted in warm, grounded hospitality.",
    initials: "AK",
  },
  {
    name: "Marco Reyes",
    role: "Head of Experiences",
    bio: "Curates attractions and activities — from guided dives to forest walks to sunset safaris.",
    initials: "MR",
  },
  {
    name: "Liu Chen",
    role: "Hospitality Director",
    bio: "Trains resort teams so every check-in and farewell feels like a welcome home.",
    initials: "LC",
  },
  {
    name: "Priya Sharma",
    role: "Guest Experience Lead",
    bio: "Handles every request end-to-end, often before guests even think to ask.",
    initials: "PS",
  },
  {
    name: "Tomás Oliveira",
    role: "Adventure Operations",
    bio: "Keeps every trail, dive, and reef safari running smooth, safe, and on time.",
    initials: "TO",
  },
  {
    name: "Nadia Haruto",
    role: "Design & Brand",
    bio: "Shapes how the island looks, feels, and reads — from signage to the smallest detail.",
    initials: "NH",
  },
];

const TEAM_LEN = TEAM.length;
const RENDERED = [...TEAM, ...TEAM, ...TEAM];

function getCardStep(scroller: HTMLElement): number {
  const card = scroller.querySelector<HTMLElement>("[data-team-card]");
  if (!card) return 0;
  const style = window.getComputedStyle(scroller);
  const gap = parseFloat(style.columnGap || style.gap || "0") || 0;
  return card.offsetWidth + gap;
}

export function OurTeamCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const recenter = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = getCardStep(el);
    if (step === 0) return;
    const cycleWidth = step * TEAM_LEN;
    const offsetInCycle = el.scrollLeft % cycleWidth;
    el.scrollLeft = cycleWidth + offsetInCycle;
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(recenter);
    window.addEventListener("resize", recenter);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recenter);
    };
  }, [recenter]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const step = getCardStep(el);
        if (step === 0) return;
        const cycleWidth = step * TEAM_LEN;
        const middleStart = cycleWidth;
        const middleEnd = cycleWidth * 2;
        while (el.scrollLeft >= middleEnd) el.scrollLeft -= cycleWidth;
        while (el.scrollLeft < middleStart) el.scrollLeft += cycleWidth;
      }, 140);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, []);

  const cycle = (dir: "prev" | "next") => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = getCardStep(el);
    if (step === 0) return;
    el.scrollBy({
      left: dir === "next" ? step : -step,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {RENDERED.map((member, i) => (
          <article
            key={`${member.name}-${i}`}
            data-team-card
            className="group/depth bg-surface border-base relative flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border p-8 shadow-md transition-all duration-500 hover:shadow-lg motion-reduce:transition-none perspective-distant md:w-[calc((100%-3rem)/3)]"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/20 to-transparent dark:from-black/20 dark:to-black/8"
              aria-hidden
            />
            <div
              className={`relative z-10 flex h-full flex-col transition-transform duration-700 ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none ${
                i % 2 === 0
                  ? "transform-[translateZ(0)_scale(1)_rotateX(0deg)_rotateY(0deg)] group-hover/depth:transform-[translateZ(22px)_scale(1.01)_rotateX(1deg)_rotateY(-1.6deg)] group-active/depth:transform-[translateZ(22px)_scale(1.01)_rotateX(1deg)_rotateY(-1.6deg)]"
                  : "transform-[translateZ(0)_scale(1)_rotateX(0deg)_rotateY(0deg)] group-hover/depth:transform-[translateZ(22px)_scale(1.01)_rotateX(1deg)_rotateY(1.6deg)] group-active/depth:transform-[translateZ(22px)_scale(1.01)_rotateX(1deg)_rotateY(1.6deg)]"
              }`}
            >
              <div
                aria-hidden
                className="bg-primary/10 text-primary flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold"
              >
                {member.initials}
              </div>
              <p className="text-base-color mt-6 flex-1 text-base leading-relaxed">
                {member.bio}
              </p>
              <div className="border-base mt-6 border-t pt-5">
                <p className="font-heading text-primary text-lg font-semibold">
                  {member.name}
                </p>
                <p className="text-primary text-sm font-bold">
                  {member.role}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => cycle("prev")}
        aria-label="Previous team members"
        className="group absolute bottom-0 left-0 top-0 z-20 inline-flex w-16 -translate-x-[calc(100%+12px)] items-center justify-center bg-transparent md:w-20"
      >
        <ChevronLeft
          className="size-8 text-primary/35 drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-all duration-300 group-hover:text-primary/95 group-active:text-primary/95"
          strokeWidth={1.8}
        />
      </button>

      <button
        type="button"
        onClick={() => cycle("next")}
        aria-label="Next team members"
        className="group absolute bottom-0 right-0 top-0 z-20 inline-flex w-16 translate-x-[calc(100%+12px)] items-center justify-center bg-transparent md:w-20"
      >
        <ChevronRight
          className="size-8 text-primary/35 drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-all duration-300 group-hover:text-primary/95 group-active:text-primary/95"
          strokeWidth={1.8}
        />
      </button>
    </div>
  );
}
