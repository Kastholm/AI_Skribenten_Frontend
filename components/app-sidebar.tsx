"use client"

import type * as React from "react"
import { useState, useEffect } from "react"
import { BookOpen, Bot, Frame, GalleryVerticalEnd, Map, PieChart, Settings2, SquareTerminal, Globe } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { useAuth } from "@/app/context/auth-context"
import { API_HOST } from "@/app/env"

type UserSite = {
  id: number
  user_id: number
  site_id: number
  role: string
}

type Site = {
  id: number
  name: string
  page_url: string
  description: string
  logo?: string
}

type SiteWithRole = Site & {
  role: string
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const [userSites, setUserSites] = useState<SiteWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSite, setActiveSite] = useState<SiteWithRole | null>(null)

  // Static navigation data
  const navMain = [
    {
      title: "Dashboard",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "#",
        },
        {
          title: "Analytics",
          url: "#",
        },
        {
          title: "Reports",
          url: "#",
        },
      ],
    },
    {
      title: "Content",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Articles",
          url: "#",
        },
        {
          title: "Templates",
          url: "#",
        },
        {
          title: "Drafts",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ]

  // Static projects data (can be removed later if not needed)
  const projects = [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ]

  // Fetch user sites when component mounts or user changes
  useEffect(() => {
    const fetchUserSites = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch user sites
        const userSitesResponse = await fetch(`${API_HOST}/users/sites?user_id=${user.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (userSitesResponse.ok) {
          const userSitesData = await userSitesResponse.json()
          console.log("User sites response:", userSitesData)

          if (userSitesData.user_sites && Array.isArray(userSitesData.user_sites)) {
            // Get site IDs from user_sites
            const siteIds = userSitesData.user_sites.map((userSite: any[]) => userSite[2]) // site_id is at index 2

            if (siteIds.length > 0) {
              // Fetch all sites to get site details
              const sitesResponse = await fetch(`${API_HOST}/sites/all`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              })

              if (sitesResponse.ok) {
                const sitesData = await sitesResponse.json()

                if (sitesData.sites && Array.isArray(sitesData.sites)) {
                  // Map user sites with site details and roles
                  const sitesWithRoles: SiteWithRole[] = userSitesData.user_sites
                    .map((userSiteArray: any[]) => {
                      const siteId = userSiteArray[2] // site_id
                      const role = userSiteArray[3] // role

                      // Find matching site
                      const siteArray = sitesData.sites.find((site: any[]) => site[0] === siteId)

                      if (siteArray) {
                        return {
                          id: siteArray[0],
                          name: siteArray[1],
                          description: siteArray[3],
                          page_url: siteArray[4],
                          role: role,
                        }
                      }
                      return null
                    })
                    .filter(Boolean) // Remove null values

                  setUserSites(sitesWithRoles)

                  // Set first site as active by default
                  if (sitesWithRoles.length > 0) {
                    setActiveSite(sitesWithRoles[0])
                  }
                }
              }
            }
          }
        } else {
          console.error("Failed to fetch user sites")
        }
      } catch (error) {
        console.error("Error fetching user sites:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserSites()
  }, [user?.id])

  // Prepare data for components
  const userData = {
    name: user?.name || "User",
    email: "user@example.com", // You can add email to user data later
    avatar: "/placeholder.svg", // Keep placeholder for now
  }

  // Convert user sites to teams format for TeamSwitcher
  const sitesAsTeams = userSites.map((site) => ({
    name: site.name,
    logo: Globe, // Use Globe icon for all sites for now
    plan: site.role.charAt(0).toUpperCase() + site.role.slice(1), // Capitalize role (viewer -> Viewer)
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {userSites.length > 0 ? (
          <TeamSwitcher teams={sitesAsTeams} />
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">AI Skribenten</span>
              <span className="truncate text-xs">No sites assigned</span>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
