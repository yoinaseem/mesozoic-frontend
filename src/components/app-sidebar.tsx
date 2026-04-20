"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { adminNavItems } from "@/config/admin-sidebar";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
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

  const visibleItems = adminNavItems.filter((item) => {
    const permissionOk =
      item.permission === null || hasPermission(item.permission);
    const roleOk = !item.role || hasRole(item.role);
    return permissionOk && roleOk;
  });

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-white -primary-foreground">
                  <TreePalm className="size-4" />
                </div>
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
