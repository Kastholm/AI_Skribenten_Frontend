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

type Site = {
  id: number
  name: string
  page_url: string
  description: string
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const [userSites, setUserSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSite, setActiveSite] = useState<Site | null>(null)

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
        // Fetch user sites using path parameter
        const userSitesResponse = await fetch(`${API_HOST}/users/sites/${user.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (userSitesResponse.ok) {
          const userSitesData = await userSitesResponse.json()
          console.log("User sites response:", userSitesData)

          if (userSitesData.sites && Array.isArray(userSitesData.sites)) {
            // Map sites data from array format to object format
            // Backend returns: [id, name, description, page_url]
            const formattedSites: Site[] = userSitesData.sites.map((siteArray: any[]) => ({
              id: siteArray[0],
              name: siteArray[1],
              description: siteArray[2],
              page_url: siteArray[3],
            }))

            setUserSites(formattedSites)
            console.log("Formatted sites:", formattedSites)

            // Set first site as active by default
            if (formattedSites.length > 0) {
              setActiveSite(formattedSites[0])
              console.log("Active site set to:", formattedSites[0])
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
    email: user?.username || "user",
    avatar: "/placeholder.svg",
  }

  // Convert user sites to teams format for TeamSwitcher
  const sitesAsTeams = userSites.map((site) => ({
    name: site.name,
    logo: Globe, // Use Globe icon for all sites for now
    plan: site.page_url, // Show the domain as the "plan"
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {userSites.length > 0 ? (
          <TeamSwitcher
            teams={sitesAsTeams}
            onTeamChange={(teamIndex) => {
              const selectedSite = userSites[teamIndex]
              setActiveSite(selectedSite)
              console.log("Active site changed to:", selectedSite)
            }}
          />
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
