import type { Metadata } from "next";
import { CustomerDashboard } from "@/components/home/CustomerDashboard";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your bookings, history, and profile on Mesozoic Isle.",
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <CustomerDashboard />
    </ProtectedRoute>
  );
}
