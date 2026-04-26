import { type ReactNode } from "react";
import Link from "next/link";

type FooterLinkItem = {
  href: string;
  label: string;
  /** When true, rendered as <a> with external-safe attributes. */
  external?: boolean;
};

const exploreLinks: FooterLinkItem[] = [
  { href: "/activities", label: "The Kingdom" },
  { href: "/beach-activities", label: "Island Experiences" },
  { href: "/accommodation", label: "Accommodation" },
  { href: "/book", label: "Book Adventure" },
];

const companyLinks: FooterLinkItem[] = [
  { href: "/about", label: "About Us" },
];

const legalLinks: FooterLinkItem[] = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
];

/**
 * Social links point to each platform's homepage — this is a college project without
 * real brand accounts yet. When actual handles exist, just swap `href` values.
 * Icons are rendered as inline SVG because lucide-react@^1.7.0 doesn't ship brand glyphs.
 */
const socialLinks: Array<{
  href: string;
  label: string;
  /** Inner SVG content; wrapped in a shared <svg> at render time. */
  svg: ReactNode;
  /** When true, renders as stroke outline (matches Instagram's visual weight). */
  outlined?: boolean;
}> = [
  {
    href: "https://www.facebook.com/hussain.naushad.2025/",
    label: "Facebook",
    outlined: true,
    svg: (
      <>
        <rect x="1" y="1" width="22" height="22" rx="6" ry="6" />
        <path d="M16 6Q12 6 12 10V20" />
        <line x1="8" y1="12" x2="15" y2="12" />
      </>
    ),
  },
  {
    href: "https://www.instagram.com/naushasame?igsh=Z2Rqd3FmaXdxZ3Jw",
    label: "Instagram",
    svg: (
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    ),
  },
  {
    href: "https://x.com/naushad786?s=20",
    label: "X",
    svg: (
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    ),
  },
];

const linkBaseClass =
  "inline-flex rounded-sm text-sm text-base-color transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function FooterLink({ link }: { link: FooterLinkItem }) {
  if (link.external) {
    const isMailto = link.href.startsWith("mailto:");
    const externalProps = isMailto
      ? {}
      : { target: "_blank", rel: "noopener noreferrer" };
    return (
      <a href={link.href} className={linkBaseClass} {...externalProps}>
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={linkBaseClass}>
      {link.label}
    </Link>
  );
}

function LinkColumn({
  heading,
  links,
}: {
  heading: string;
  links: FooterLinkItem[];
}) {
  return (
    <div>
      <h3 className="text-primary text-sm font-semibold tracking-[0.18em] uppercase">
        {heading}
      </h3>
      <ul className="mt-5 flex flex-col gap-3">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <FooterLink link={link} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-surface border-base mt-auto shrink-0 border-t">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-12 lg:gap-20">
          {/* Brand */}
          <div className="flex flex-col gap-5 md:max-w-sm">
            <Link
              href="/"
              aria-label="Mesozoic Isle home"
              className="text-primary focus-visible:ring-ring focus-visible:ring-offset-background inline-flex w-fit rounded-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <span className="inline-flex flex-col items-center leading-none">
                <span className="font-heading text-[1.45rem] font-semibold tracking-[0.32em] lg:text-[1.6rem]">
                  MESOZOIC
                </span>
                <span className="mt-1 inline-flex items-center justify-center gap-2">
                  <span
                    className="h-px w-9 bg-current opacity-90 lg:w-10"
                    aria-hidden
                  />
                  <span className="font-heading text-[0.82rem] font-semibold tracking-[0.24em] lg:text-[0.9rem]">
                    ISLE
                  </span>
                  <span
                    className="h-px w-9 bg-current opacity-90 lg:w-10"
                    aria-hidden
                  />
                </span>
              </span>
            </Link>

            <p className="text-muted max-w-xs text-sm leading-relaxed">
              Prehistoric adventures across accommodation, attractions, and
              curated island experiences.
            </p>

            {socialLinks.length > 0 ? (
              <nav
                className="flex items-center gap-4"
                aria-label="Social media"
              >
                {socialLinks.map(({ href, label, svg, outlined }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-primary focus-visible:ring-ring focus-visible:ring-offset-background inline-flex rounded-full transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill={outlined ? "none" : "currentColor"}
                      stroke={outlined ? "currentColor" : undefined}
                      strokeWidth={outlined ? 2 : undefined}
                      strokeLinecap={outlined ? "round" : undefined}
                      strokeLinejoin={outlined ? "round" : undefined}
                      aria-hidden
                    >
                      {svg}
                    </svg>
                  </a>
                ))}
              </nav>
            ) : null}
          </div>

          {/* Link columns — pushed right with a gap in the middle */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:gap-x-16 lg:gap-x-24">
            <LinkColumn heading="Explore" links={exploreLinks} />
            <LinkColumn heading="Company" links={companyLinks} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-base mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-muted text-sm">
            © {new Date().getFullYear()} Mesozoic Isle. All rights reserved.
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
