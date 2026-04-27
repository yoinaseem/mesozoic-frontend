"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  initials: string;
  avatarSrc?: string;
};

const TEAM: TeamMember[] = [
  {
    name: "Yaeesh Naseem",
    role: "Founder & CEO",
    bio: "Steers the island vision and keeps every guest stay rooted in warm, grounded hospitality.",
    initials: "YN",
    avatarSrc: "/img/team-yaeesh-naseem.png",
  },
  {
    name: "Ahmed Maaiz",
    role: "Head of Experiences",
    bio: "Curates attractions and activities — from guided dives to forest walks to sunset safaris.",
    initials: "AM",
    avatarSrc: "/img/team-ahmed-maaiz.png",
  },
  {
    name: "Sulaiman Zahwan",
    role: "Hospitality Director",
    bio: "Trains resort teams so every check-in and farewell feels like a welcome home.",
    initials: "SZ",
    avatarSrc: "/img/team-sulaiman-zahwan.png",
  },
  {
    name: "Anoof Ibrahim",
    role: "Guest Experience Lead",
    bio: "Handles every request end-to-end, often before guests even think to ask.",
    initials: "AI",
    avatarSrc: "/img/team-anoof-ibrahim.png",
  },
  {
    name: "Mohamed Nawish",
    role: "Adventure Operations",
    bio: "Keeps every trail, dive, and reef safari running smooth, safe, and on time.",
    initials: "MN",
    avatarSrc: "/img/team-mohamed-nawish.png",
  }
  
];

const TEAM_LEN = TEAM.length;
const RENDERED = [...TEAM, ...TEAM, ...TEAM, ...TEAM, ...TEAM];
const MIDDLE_CYCLE_INDEX = 2;

function getCardStep(scroller: HTMLElement): number {
  const card = scroller.querySelector<HTMLElement>("[data-team-card]");
  if (!card) return 0;
  const style = window.getComputedStyle(scroller);
  const gap = parseFloat(style.columnGap || style.gap || "0") || 0;
  return card.offsetWidth + gap;
}

export function OurTeamCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizeToMiddleCycle = useCallback((el: HTMLElement, step: number) => {
    if (step <= 0) return;
    const cycleWidth = step * TEAM_LEN;
    const middleStart = cycleWidth * MIDDLE_CYCLE_INDEX;
    const middleEnd = cycleWidth * (MIDDLE_CYCLE_INDEX + 1);

    if (el.scrollLeft >= middleEnd || el.scrollLeft < middleStart) {
      const offsetInCycle =
        ((el.scrollLeft - middleStart) % cycleWidth + cycleWidth) % cycleWidth;
      el.scrollLeft = middleStart + offsetInCycle;
    }
  }, []);

  const recenter = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = getCardStep(el);
    if (step === 0) return;
    normalizeToMiddleCycle(el, step);
  }, [normalizeToMiddleCycle]);

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
      if (isProgrammaticScrollRef.current) return;
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const step = getCardStep(el);
        if (step === 0) return;
        normalizeToMiddleCycle(el, step);
      }, 140);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [normalizeToMiddleCycle]);

  const cycle = (dir: "prev" | "next") => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = getCardStep(el);
    if (step === 0) return;

    const cycleWidth = step * TEAM_LEN;
    const middleStart = cycleWidth * MIDDLE_CYCLE_INDEX;
    const middleEnd = cycleWidth * (MIDDLE_CYCLE_INDEX + 1);

    isProgrammaticScrollRef.current = true;
    if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);
    const delta = dir === "next" ? step : -step;

    // When crossing the seam, jump first (no animation) then start smooth scroll
    // on the next frame. This removes the micro-stutter on card 5 -> 1.
    if (dir === "next" && el.scrollLeft + step >= middleEnd) {
      el.scrollLeft -= cycleWidth;
      requestAnimationFrame(() => {
        el.scrollBy({ left: delta, behavior: "smooth" });
      });
    } else if (dir === "prev" && el.scrollLeft - step < middleStart) {
      el.scrollLeft += cycleWidth;
      requestAnimationFrame(() => {
        el.scrollBy({ left: delta, behavior: "smooth" });
      });
    } else {
      el.scrollBy({ left: delta, behavior: "smooth" });
    }

    programmaticTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      normalizeToMiddleCycle(el, step);
    }, 420);
  };

  useEffect(() => {
    return () => {
      if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);
    };
  }, []);

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
            className="group/depth bg-surface border-base dark:bg-black dark:border-black relative flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border p-8 shadow-md transition-all duration-500 hover:shadow-lg motion-reduce:transition-none perspective-distant md:w-[calc((100%-3rem)/3)]"
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
                className="bg-primary/10 text-primary relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-2xl font-semibold ring-2 ring-black/85 dark:ring-white/85"
              >
                {member.avatarSrc ? (
                  <Image
                    src={member.avatarSrc}
                    alt={`${member.name} profile`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  member.initials
                )}
              </div>
              <p className="text-base-color mt-6 flex-1 text-base leading-relaxed font-semibold">
                {member.bio}
              </p>
              <div className="border-base mt-6 border-t pt-5">
                <p className="font-heading text-primary text-lg font-bold">
                  {member.name}
                </p>
                <p className="text-primary text-sm font-extrabold">
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
