import {
  Home,
  Users,
  Bell,
  HelpCircle,
  UsersRound,
  Settings,
  BarChart3,
} from "lucide-react"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { type Item, Main } from "./Main"
import { User } from "./User"

const mentorItems: Item[] = [
  { icon: Home, title: "Dashboard", path: "/" },
  { icon: Bell, title: "Advarsler", path: "/alerts" },
]

const adminItems: Item[] = [
  { icon: Users, title: "Elever", path: "/admin/students" },
  { icon: HelpCircle, title: "Spørgsmål", path: "/admin/questions" },
  { icon: UsersRound, title: "Grupper", path: "/admin/groups" },
  { icon: Settings, title: "Brugere", path: "/admin" },
]

const analystItems: Item[] = [
  { icon: BarChart3, title: "Analytics", path: "/analytics" },
]

export function AppSidebar() {
  const { user: currentUser } = useAuth()

  // Type assertion for role property which may be added via backend extension
  const userWithRole = currentUser as (typeof currentUser & { role?: string }) | null
  const isAdmin = currentUser?.is_superuser || userWithRole?.role === "admin"
  const isAnalyst = userWithRole?.role === "analyst" || isAdmin

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Logo variant="responsive" />
      </SidebarHeader>
      <SidebarContent>
        <Main items={mentorItems} />
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <Main items={adminItems} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {isAnalyst && (
          <SidebarGroup>
            <SidebarGroupLabel>Forskning</SidebarGroupLabel>
            <SidebarGroupContent>
              <Main items={analystItems} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
