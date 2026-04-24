"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
        className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {RENDERED.map((member, i) => (
          <article
            key={`${member.name}-${i}`}
            data-team-card
            className="bg-surface ring-black/5 hover:ring-sage flex w-[85%] shrink-0 snap-start flex-col rounded-2xl p-8 shadow-sm ring-1 transition hover:shadow-md sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
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
              <p className="font-heading text-primary-deep text-lg font-semibold">
                {member.name}
              </p>
              <p className="text-lagoon text-sm font-medium">{member.role}</p>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => cycle("prev")}
        aria-label="Previous team members"
        className="bg-surface text-primary ring-black/5 hover:bg-primary hover:text-primary-foreground focus-visible:ring-primary/40 absolute left-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md ring-1 transition focus-visible:outline-none focus-visible:ring-2 md:left-2 lg:-left-5"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => cycle("next")}
        aria-label="Next team members"
        className="bg-surface text-primary ring-black/5 hover:bg-primary hover:text-primary-foreground focus-visible:ring-primary/40 absolute right-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md ring-1 transition focus-visible:outline-none focus-visible:ring-2 md:right-2 lg:-right-5"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
