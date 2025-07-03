"use client"

import type * as React from "react"
import { useState, useEffect } from "react"
import { GalleryVerticalEnd, Globe, Camera } from "lucide-react"

import { NavMain } from "@/components/nav-main"
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
  const [shutterstockAuth, setShutterstockAuth] = useState<{
    isAuthenticated: boolean
    isLoading: boolean
  }>({
    isAuthenticated: false,
    isLoading: false,
  })

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

  const handleShutterstockLogin = async () => {
    setShutterstockAuth((prev) => ({ ...prev, isLoading: true }))

    try {
      console.log("Starting Shutterstock auth...")

      const response = await fetch(`https://db14-86-52-42-195.ngrok-free.app/auth/start-auth`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // Skip ngrok browser warning
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers)

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        console.log("Content-Type:", contentType)

        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()
          console.log("Response data:", data)

          if (data.auth_url) {
            // Redirect to Shutterstock auth URL
            window.location.href = data.auth_url
          } else {
            console.error("No auth_url in response")
          }
        } else {
          const text = await response.text()
          console.error("Response is not JSON:", text)
        }
      } else {
        const errorText = await response.text()
        console.error("Request failed:", response.status, errorText)
      }
    } catch (error) {
      console.error("Error starting Shutterstock auth:", error)
    } finally {
      setShutterstockAuth((prev) => ({ ...prev, isLoading: false }))
    }
  }

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
        <NavMain />
        <div className="mt-auto px-3 pb-3">
          <button
            onClick={handleShutterstockLogin}
            disabled={shutterstockAuth.isLoading}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
              shutterstockAuth.isAuthenticated
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "bg-orange-100 text-orange-800 hover:bg-orange-200"
            } disabled:opacity-50`}
          >
            <Camera className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Shutterstock Login</span>
              <span className="text-xs opacity-75">
                {shutterstockAuth.isLoading
                  ? "Connecting..."
                  : shutterstockAuth.isAuthenticated
                    ? "Connected"
                    : "Not connected"}
              </span>
            </div>
          </button>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
