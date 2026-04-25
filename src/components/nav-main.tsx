"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AdminNavItem } from "@/config/admin-sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

// `globals.css` dims `[data-sidebar] a` to opacity 0.85 by default and only
// brightens to 1 on hover; for active items that means the brand green flips
// from washed-out to vivid on hover (visually reads as "darkening"). Pinning
// opacity:1 with !important neutralises the transition.
const ACTIVE_CLASS =
  "data-active:bg-[var(--color-primary)] data-active:text-white data-active:opacity-100! data-active:hover:bg-[var(--color-primary)] data-active:hover:text-white";

// Section parent treatment: when the active route lives inside a collapsible
// section, the parent button + chevron tint primary and go bold so the section
// reads as "you are here" without needing a background tint on the wrapper.
// Hover variants explicitly re-apply primary so shadcn's default
// hover:text-sidebar-accent-foreground doesn't drag the colour to muted grey.
// (Note: `hover:text-current` doesn't work here — `color: currentColor` is
// circular and doesn't actually pin the value.)
const ACTIVE_PARENT_CLASS =
  "font-bold text-[var(--color-primary)] hover:text-[var(--color-primary)]! [&>svg]:text-[var(--color-primary)] [&>svg]:hover:text-[var(--color-primary)]! opacity-100!";

export function NavMain({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Management</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <NavMainItem key={item.title} item={item} pathname={pathname} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavMainItem({
  item,
  pathname,
}: {
  item: AdminNavItem;
  pathname: string;
}) {
  const isActive = pathname.startsWith(item.url);
  const [userOpen, setUserOpen] = useState(isActive);
  const [prevActive, setPrevActive] = useState(isActive);

  if (isActive !== prevActive) {
    setPrevActive(isActive);
    if (isActive) setUserOpen(true);
  }

  if (item.comingSoon) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={item.title} disabled>
          <item.icon className="size-4" />
          <span className="opacity-50">{item.title}</span>
          <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Soon
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const hasChildren = (item.items?.length ?? 0) > 0;
  const open = isActive || userOpen;

  return (
    <Collapsible asChild open={open} onOpenChange={setUserOpen}>
      <SidebarMenuItem className={cn(open && hasChildren && "pb-1.5")}>
        <SidebarMenuButton
          asChild
          tooltip={item.title}
          isActive={isActive && !hasChildren}
          className={cn(
            ACTIVE_CLASS,
            isActive && hasChildren && ACTIVE_PARENT_CLASS,
            hasChildren && "hover:bg-transparent! ",
          )}
        >
          <Link href={item.url}>
            <item.icon className="size-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
        {hasChildren ? (
          <>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction
                className={cn(
                  "data-[state=open]:rotate-90",
                  isActive &&
                    "text-(--color-primary) hover:bg-transparent! hover:text-(--color-primary)! peer-hover/menu-button:text-(--color-primary)!",
                )}
              >
                <ChevronRightIcon />
                <span className="sr-only">Toggle</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items!.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={pathname === subItem.url}
                      className={ACTIVE_CLASS}
                    >
                      <Link href={subItem.url}>
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </>
        ) : null}
      </SidebarMenuItem>
    </Collapsible>
  );
}
