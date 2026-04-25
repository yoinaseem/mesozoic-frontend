import {
  LayoutDashboard,
  Hotel,
  Ship,
  Umbrella,
  TreePalm,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  permission: string | null;
  role?: string;
  comingSoon?: boolean;
  items?: { title: string; url: string }[];
};

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },
  {
    title: "Hotels",
    url: "/admin/hotels",
    icon: Hotel,
    permission: "hotels.view",
    items: [
      { title: "Hotels", url: "/admin/hotels" },
      { title: "Bookings", url: "/admin/hotels/bookings" },
    ],
  },
  {
    title: "Ferries",
    url: "/admin/ferries",
    icon: Ship,
    permission: "ferry.view",
    items: [
      { title: "Ferries", url: "/admin/ferries" },
      { title: "Schedules", url: "/admin/ferry-schedules" },
    ],
  },
  {
    title: "Beach",
    url: "/admin/beach-activities",
    icon: Umbrella,
    permission: "beach.view",
    items: [
      { title: "Activities", url: "/admin/beach-activities" },
      { title: "Schedules", url: "/admin/beach-activity-schedules" },
    ],
  },
  {
    title: "Theme Park",
    url: "/admin/parks",
    icon: TreePalm,
    permission: "park.view",
    items: [
      { title: "Parks", url: "/admin/parks" },
      { title: "Activity bookings", url: "/admin/park-activity-bookings" },
    ],
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
    permission: null,
    role: "superadmin",
    items: [
      { title: "All users", url: "/admin/users" },
      { title: "Create user", url: "/admin/users/new" },
    ],
  },
];
