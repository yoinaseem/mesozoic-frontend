import { ProtectedRoute } from "@/components/auth/protected-route";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
