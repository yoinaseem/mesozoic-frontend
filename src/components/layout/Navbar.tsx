"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/activities", label: "The Kingdom" },
  { href: "#activities", label: "Activities" },
  { href: "/accommodation", label: "Accommodation" },
] as const;

/** Approximate fixed bar height (py-4 + text line); used with hero-card-sentinel rect */
const NAVBAR_HEIGHT_PX = 72;

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();
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

  // temporarily commented, to move to different component/page
  // const handleBookNow = () => {
  //   if (!isAuthenticated) {
  //     router.push("/login");
  //   } else {
  //     router.push("/booking"); // Redirecting to booking page per instructions
  //   }
  //   router.push("/book");
  // };

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  const linkBase =
    "relative pb-1 text-sm uppercase font-heading tracking-widest transition-opacity hover:opacity-100! after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:left-0 hover:after:w-full";

  const linkClass = transparentOnHero
    ? `${linkBase} text-white!  font-normal drop-shadow-md`
    : `${linkBase} text-primary font-bold`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 w-full transition-[background-color,border-color] duration-300 ${
        transparentOnHero
          ? "border-b border-transparent bg-transparent"
          : "border-b-2 border-base bg-surface"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link
          href="/"
          className={
            transparentOnHero
              ? "inline-block border-b-2 border-b-transparent pb-0.5 text-2xl font-heading tracking-widest font-bold text-white! drop-shadow-md transition-[border-bottom-color,opacity] hover:border-b-white hover:opacity-100!"
              : "inline-block border-b-2 border-b-transparent pb-0.5 text-2xl font-heading tracking-widest font-bold text-primary transition-[border-bottom-color,opacity] hover:border-b-current hover:opacity-100!"
          }
          aria-label="Mesozoic Isle home"
        >
          Mesozoic Isle
        </Link>

        <nav
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6"
          aria-label="Primary"
        >
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <ModeToggle
            className={transparentOnHero ? "text-white! drop-shadow-md" : ""}
          />

          {loading ? (
            <div aria-hidden className="size-8" />
          ) : isAuthenticated && user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Account menu"
                >
                  <Avatar size="default">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="center"
                sideOffset={8}
                className="w-64 p-2"
              >
                <DropdownMenuLabel className="px-3 py-3 font-normal">
                  <div className="flex items-center gap-3">
                    <Avatar size="lg">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-heading font-semibold">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="px-3 py-2"
                    onSelect={() => router.push("/dashboard")}
                  >
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="px-3 py-2"
                    onSelect={() => router.push("/dashboard/settings")}
                  >
                    Account Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="px-3 py-2"
                  variant="destructive"
                  onSelect={handleLogout}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className={linkClass}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
