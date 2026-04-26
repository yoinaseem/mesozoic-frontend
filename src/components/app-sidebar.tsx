"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { adminNavItems } from "@/config/admin-sidebar";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { listMyHotels, type MyHotel } from "@/lib/api/room-bookings";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { TreePalm } from "lucide-react";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { hasPermission, hasRole } = useAuth();

  // Hotel-managers (but not superadmins, whose /auth/me/hotels returns every
  // live hotel) get a one-click jump from the sidebar into each hotel they
  // manage. Fetched once on mount; falls back silently to the static config
  // if the request fails.
  const isHotelManagerOnly = hasRole("hotel-manager") && !hasRole("superadmin");
  const [myHotels, setMyHotels] = useState<MyHotel[] | null>(null);

  useEffect(() => {
    if (!isHotelManagerOnly) return;
    let cancelled = false;
    listMyHotels()
      .then((res) => {
        if (!cancelled) setMyHotels(res.data);
      })
      .catch(() => {
        if (!cancelled) setMyHotels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isHotelManagerOnly]);

  const visibleItems = useMemo(() => {
    return adminNavItems
      .filter((item) => {
        const permissionOk =
          item.permission === null || hasPermission(item.permission);
        const roleOk = !item.role || hasRole(item.role);
        return permissionOk && roleOk;
      })
      .map((item) => {
        if (item.title !== "Hotels" || !myHotels?.length) return item;
        return {
          ...item,
          items: [
            ...myHotels.map((h) => ({
              title: h.name,
              url: `/admin/hotels/${h.id}`,
            })),
            ...(item.items ?? []),
          ],
        };
      });
  }, [hasPermission, hasRole, myHotels]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/dashboard">
                {/* Please add actual logo once finalized */}
                {/* <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-white -primary-foreground">
                  <TreePalm className="size-4" />
                </div> */}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Mesozoic Isle</span>
                  <span className="truncate text-xs">Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
