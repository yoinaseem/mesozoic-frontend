"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/activities", label: "The Kingdom" },
  { href: "/beach-activities", label: "Island Experiences" },
  { href: "/accommodation", label: "Accommodation" },
  { href: "/about", label: "About Us" },
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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  const linkBase =
    "relative pb-1 text-sm uppercase font-heading tracking-widest transition-opacity hover:opacity-100! after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:left-0 hover:after:w-full";

  const linkClass = transparentOnHero
    ? `${linkBase} text-white!  font-normal drop-shadow-md`
    : `${linkBase} text-primary font-bold`;
  const toggleClass = transparentOnHero
    ? "text-white! drop-shadow-md hover:bg-white/10"
    : "text-primary hover:bg-base/70";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 w-full transition-[background-color,border-color] duration-300 ${
        transparentOnHero
          ? "border-b border-transparent bg-transparent"
          : "border-b-2 border-base bg-surface"
      }`}
    >
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 lg:gap-6">
          <Link
            href="/"
            className={
              transparentOnHero
                ? "inline-block border-b-2 border-b-transparent pb-0.5 text-xl lg:text-2xl font-heading tracking-widest font-bold text-white! drop-shadow-md transition-[border-bottom-color,opacity] hover:border-b-white hover:opacity-100!"
                : "inline-block border-b-2 border-b-transparent pb-0.5 text-xl lg:text-2xl font-heading tracking-widest font-bold text-primary transition-[border-bottom-color,opacity] hover:border-b-current hover:opacity-100!"
            }
            aria-label="Mesozoic Isle home"
          >
            Mesozoic Isle
          </Link>

          <nav
            className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-6"
            aria-label="Primary"
          >
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 lg:gap-4">
            <ModeToggle className={toggleClass} />

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
                  align="end"
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
              <Link href="/login" className={`hidden lg:inline ${linkClass}`}>
                Sign in
              </Link>
            )}

            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`lg:hidden ${toggleClass}`}
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
          </div>
        </div>

        <SheetContent side="right" className="w-72 p-0 flex flex-col">
          <SheetHeader className="border-b border-base p-6">
            <SheetTitle className="text-xl font-heading tracking-widest font-bold text-primary">
              Mesozoic Isle
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 p-4" aria-label="Mobile primary">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <SheetClose asChild key={href}>
                  <Link
                    href={href}
                    className={`rounded-md px-3 py-3 text-sm uppercase font-heading tracking-widest transition-colors hover:bg-base/70 ${
                      active
                        ? "bg-base/50 text-primary font-bold"
                        : "text-primary font-semibold"
                    }`}
                  >
                    {label}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-base p-4">
            {loading ? (
              <div aria-hidden className="h-10" />
            ) : isAuthenticated && user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-1">
                  <Avatar size="lg">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-sm font-heading font-semibold truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <SheetClose asChild>
                    <Link
                      href="/dashboard"
                      className="rounded-md px-3 py-2 text-sm hover:bg-base/70"
                    >
                      Dashboard
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/dashboard/settings"
                      className="rounded-md px-3 py-2 text-sm hover:bg-base/70"
                    >
                      Account Settings
                    </Link>
                  </SheetClose>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <SheetClose asChild>
                <Link
                  href="/login"
                  className="block rounded-md px-3 py-3 text-center text-sm uppercase font-heading tracking-widest font-bold text-primary hover:bg-base/70"
                >
                  Sign in
                </Link>
              </SheetClose>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
