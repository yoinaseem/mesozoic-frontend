"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const navLinks = [
  { href: "#attractions", label: "Attractions" },
  { href: "#activities", label: "Activities" },
  { href: "#accommodation", label: "Accommodation" },
];

/** Approximate fixed bar height (py-4 + text line); used with hero-card-sentinel rect */
const NAVBAR_HEIGHT_PX = 72;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading, logout } = useAuth();
  const isHome = pathname === "/";
  const [pastHeroCard, setPastHeroCard] = useState(false);

  useEffect(() => {
    if (!isHome) return;

    const sentinel = document.getElementById("hero-card-sentinel");
    if (!sentinel) return;

    const update = () => {
      const { top } = sentinel.getBoundingClientRect();
      setPastHeroCard(top <= NAVBAR_HEIGHT_PX);
    };

    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isHome]);

  const transparentOnHero = isHome && !pastHeroCard;

  const handleBookNow = () => {
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname ?? "/");
      router.push(`/login?next=${next}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 w-full transition-[background-color,border-color] duration-300 ${
        transparentOnHero
          ? "border-b border-transparent bg-transparent"
          : "border-b-2 border-base bg-surface"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-6">
        <Link
          href="/"
          className={
            transparentOnHero
              ? "inline-block border-b-2 border-b-transparent pb-0.5 text-xl font-bold text-white! drop-shadow-md transition-[border-bottom-color,opacity] hover:border-b-white hover:opacity-100!"
              : "inline-block border-b-2 border-b-transparent pb-0.5 text-xl font-bold text-primary transition-[border-bottom-color,opacity] hover:border-b-current hover:opacity-100!"
          }
          aria-label="Mesozoic Isle home"
        >
          Mesozoic Isle
        </Link>

        <nav className="flex flex-wrap items-center gap-6" aria-label="Primary">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={
                transparentOnHero
                  ? "inline-block border-b-2 border-b-transparent pb-0.5 text-base font-semibold text-white! drop-shadow-md transition-[border-bottom-color,opacity] hover:border-b-white hover:opacity-100!"
                  : "inline-block border-b-2 border-b-transparent pb-0.5 text-base font-semibold text-primary transition-[border-bottom-color,opacity] hover:border-b-current hover:opacity-100!"
              }
            >
              {label}
            </a>
          ))}
        </nav>

        {loading ? (
          <div aria-hidden className="h-10 w-24" />
        ) : isAuthenticated ? (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLogout}
              className={
                transparentOnHero
                  ? "inline-block border-b-2 border-b-transparent pb-0.5 text-base font-semibold text-white! drop-shadow-md transition-[border-bottom-color,opacity] hover:border-b-white hover:opacity-100!"
                  : "inline-block border-b-2 border-b-transparent pb-0.5 text-base font-semibold text-primary transition-[border-bottom-color,opacity] hover:border-b-current hover:opacity-100!"
              }
            >
              Logout
            </button>
            <button type="button" className="btn-accent" onClick={handleBookNow}>
              Book Now
            </button>
          </div>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(pathname ?? "/")}`}
            className="btn-primary"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
