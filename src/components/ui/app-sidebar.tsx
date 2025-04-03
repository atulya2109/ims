"use client";
import { CircleUser, Home, FlaskConical, LucideIcon, LogInIcon, LogOutIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@ims/components/ui/sidebar"

const items = {
  dashboard: [{
    title: "Overview",
    icon: Home,
    href: "/",
  },
  {
    title: "Equipments",
    icon: FlaskConical,
    href: "/equipments",
  },
  {
    title: "Users",
    icon: CircleUser,
    href: "/users",
  }],
  actions: [
    {
      title: "Check Out",
      icon: LogOutIcon,
      href: "/checkout",
    },
    {
      title: "Check In",
      icon: LogInIcon,
      href: "/checkin",
    },

  ]
}

function ActionsMenu({ items, ...props }: { items: { title: string, icon: LucideIcon, href: string }[] } & React.ComponentProps<typeof SidebarGroup>) {
  const pathname = usePathname()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Actions</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title} >
              <SidebarMenuButton isActive={pathname === item.href} asChild>
                <a href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function DashboardMenu({ items, ...props }: { items: { title: string, icon: LucideIcon, href: string }[] } & React.ComponentProps<typeof SidebarGroup>) {
  const pathname = usePathname()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title} >
              <SidebarMenuButton isActive={pathname === item.href} asChild>
                <a href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}


export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
      </SidebarHeader>
      <SidebarContent>
        <DashboardMenu items={items.dashboard} />
        <ActionsMenu items={items.actions} />
      </SidebarContent>
    </Sidebar>
  )
}
