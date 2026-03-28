import Link from "next/link";

const navLinks = [
  { href: "#attractions", label: "Attractions" },
  { href: "#activities", label: "Activities" },
  { href: "#accommodation", label: "Accommodation" },
];

export default function Navbar() {
  return (
    <header className="bg-surface border-b border-base">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-6">
        <Link
          href="/"
          className="text-xl font-bold text-primary"
          aria-label="Mesozoic Isle home"
        >
          Mesozoic Isle
        </Link>

        <nav className="flex flex-wrap items-center gap-6" aria-label="Primary">
          {navLinks.map(({ href, label }) => (
            <a key={href} href={href} className="text-base text-base-color">
              {label}
            </a>
          ))}
        </nav>

        <button type="button" className="btn-accent">
          Book Now
        </button>
      </div>
    </header>
  );
}
