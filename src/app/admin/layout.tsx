import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin | Mesozoic Isle",
    template: "%s | Mesozoic Isle Admin",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}
