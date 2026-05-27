"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  User,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Settings,
  BookOpen,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { clearSession } from "@/lib/app-session"
import { FooterDisclaimer } from "@/components/footer-disclaimer"

const navItems = [
  { title: "My Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "My Profile", icon: User, href: "/profile" },
  { title: "My Grades", icon: GraduationCap, href: "/marks" },
  { title: "My Attendance", icon: CalendarCheck, href: "/attendance" },
  { title: "My Fees", icon: CreditCard, href: "/fees" },
  { title: "Academic Insights", icon: BarChart3, href: "/analytics" },
  { title: "Timetable", icon: CalendarCheck, href: "/timetable" },
]

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  function signOut() {
    clearSession()
    router.replace("/login")
  }

  return (
    <Sidebar className="border-r border-border/50 bg-sidebar">
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">UniBoard</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                tooltip={item.title}
                className={`h-10 px-4 transition-all duration-200 hover:bg-accent ${
                  pathname === item.href ? "bg-accent" : ""
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-10 px-4" render={<Link href="/settings" />}>
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-10 px-4" onClick={signOut}>
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-4 hidden group-data-[collapsible=icon]:hidden md:block">
          <FooterDisclaimer />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
