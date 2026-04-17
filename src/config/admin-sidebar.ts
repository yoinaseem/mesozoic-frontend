import {
  LayoutDashboard,
  Hotel,
  Ship,
  Umbrella,
  TreePalm,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  permission: string | null;
  comingSoon?: boolean;
  items?: { title: string; url: string }[];
};

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    url: "/manage/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },
  {
    title: "Hotels",
    url: "/manage/hotels",
    icon: Hotel,
    permission: "hotels.view",
    items: [
      { title: "Hotels", url: "/manage/hotels" },
      { title: "Room Types", url: "/manage/room-types" },
      { title: "Rooms", url: "/manage/rooms" },
    ],
  },
  {
    title: "Ferries",
    url: "/manage/ferries",
    icon: Ship,
    permission: "ferry.view",
    items: [
      { title: "Ferries", url: "/manage/ferries" },
      { title: "Schedules", url: "/manage/ferry-schedules" },
    ],
  },
  {
    title: "Beach",
    url: "/manage/beach-activities",
    icon: Umbrella,
    permission: "beach.view",
    items: [
      { title: "Activities", url: "/manage/beach-activities" },
      { title: "Schedules", url: "/manage/beach-activity-schedules" },
    ],
  },
  {
    title: "Theme Park",
    url: "/manage/theme-park",
    icon: TreePalm,
    permission: "park.view",
  },
];
