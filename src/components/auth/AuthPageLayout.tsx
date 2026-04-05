type AuthPageLayoutProps = {
  children: React.ReactNode;
  variant: "login" | "register";
};

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="bg-base flex min-h-screen flex-col">
      <main className="bg-primary flex flex-1 flex-col py-16">
        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
