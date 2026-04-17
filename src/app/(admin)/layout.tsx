import { ProtectedRoute } from "@/components/auth/protected-route";

const MANAGEMENT_ROLES = [
  "superadmin",
  "hotel-manager",
  "ferry-manager",
  "park-manager",
  "beach-manager",
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>{children}</ProtectedRoute>;
}
