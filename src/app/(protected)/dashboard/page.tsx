"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="bg-base min-h-screen">
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <section className="card max-w-3xl">
            <h1 className="text-3xl font-bold text-primary">
              Welcome Back {user?.name ?? "-"}
            </h1>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-base border border-base rounded-lg p-6">
                <p className="text-muted text-sm">Name</p>
                <p className="text-lg font-semibold text-base-color mt-2">
                  {user?.name ?? "-"}
                </p>
              </div>

              <div className="bg-base border border-base rounded-lg p-6">
                <p className="text-muted text-sm">Email</p>
                <p className="text-lg font-semibold text-base-color mt-2">
                  {user?.email ?? "-"}
                </p>
              </div>
            </div>

            <div>
              <button
                className="btn-primary"
                onClick={handleLogout}
                disabled={loading}
              >
                {loading ? "Signing Out..." : "Logout"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
