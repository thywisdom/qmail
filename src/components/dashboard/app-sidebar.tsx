"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconSettings,
  IconInnerShadowTop,
  IconUserCircle,
  IconArrowLeft,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavUser } from "@/components/dashboard/nav-user"

const data = {
  navMain: [
    {
      title: "Back",
      url: "/mail",
      icon: IconArrowLeft,
    },
    {
      title: "Analytics",
      url: "/dashboard",
      icon: IconChartBar,
    },
    {
      title: "Account",
      url: "/dashboard/account",
      icon: IconUserCircle,
    },
    {
      title: "Data Control",
      url: "/dashboard/data-control",
      icon: IconDatabase,
    },
    {
      title: "Quantsphere",
      url: "/dashboard/quantsphere",
      icon: IconSettings,
    },
  ],
}

import { db } from "@/lib/db"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = db.useAuth()
  const { data: userData } = db.useQuery(user?.email ? { $users: { $: { where: { email: user.email } } } } : null)
  const userProfile = userData?.$users?.[0]

  const currentUser = {
    name: userProfile?.name || "User",
    email: user?.email || "user@example.com",
    avatarUrl: userProfile?.avatarUrl || "/images/logo.png",
  }

  return (
    <Sidebar collapsible="none" className="h-auto border-r" {...props}>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/mail">
                <img src="/images/logo.png" alt="QMail" className="size-6" />
                <span className="text-base font-semibold">QMail</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar >
  )
}

