import Link from "next/link";

type AuthPageLayoutProps = {
  children: React.ReactNode;
  variant: "login" | "register";
};

export function AuthPageLayout({ children, variant }: AuthPageLayoutProps) {
  const alternate =
    variant === "login"
      ? { href: "/register", label: "Register" }
      : { href: "/login", label: "Sign in" };

  return (
    <div className="bg-base flex min-h-screen flex-col">
      <header className="border-b border-base bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Mesozoic Isle
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-base-color">
              Home
            </Link>
            <Link href={alternate.href} className="text-base-color">
              {alternate.label}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col py-16">
        <div className="mx-auto flex w-full max-w-7xl flex-1 justify-center px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
