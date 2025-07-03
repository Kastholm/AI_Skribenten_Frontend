"use client"

import type * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Camera,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useState } from "react"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Artikler",
      url: "#",
      icon: BookOpen,
      isActive: false,
      items: [
        {
          title: "Scheduled",
          url: "/artikler/scheduled",
        },
        {
          title: "Review",
          url: "/artikler/review",
        },
        {
          title: "Archive",
          url: "/artikler/archive",
        },
      ],
    },
    {
      title: "Prompts",
      url: "/prompts",
      icon: Bot,
      isActive: false,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Add User",
          url: "/add-user",
        },
        {
          title: "Add Site",
          url: "/add-site",
        },
        {
          title: "Link User Site",
          url: "/link-user-site",
        },
        {
          title: "Page Settings",
          url: "/settings/page",
        },
      ],
    },
  ],
  projects: [
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [shutterstockStatus, setShutterstockStatus] = useState<"disconnected" | "connected" | "loading">("disconnected")

  const handleShutterstockLogin = async () => {
    setShutterstockStatus("loading")

    try {
      console.log("Starting Shutterstock auth...")

      const response = await fetch("https://db14-86-52-42-195.ngrok-free.app/auth/start-auth", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Response not OK:", errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      console.log("Content-Type:", contentType)

      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("Response is not JSON:", responseText)
        throw new Error("Response is not JSON")
      }

      const data = await response.json()
      console.log("Auth response:", data)

      if (data.auth_url) {
        console.log("Redirecting to:", data.auth_url)
        window.location.href = data.auth_url
      } else {
        throw new Error("No auth_url in response")
      }
    } catch (error) {
      console.error("Shutterstock auth error:", error)
      setShutterstockStatus("disconnected")
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          <Button
            onClick={handleShutterstockLogin}
            disabled={shutterstockStatus === "loading"}
            className={`w-full justify-start gap-2 h-auto py-3 ${
              shutterstockStatus === "connected"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : shutterstockStatus === "loading"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-orange-600 hover:bg-orange-700 text-white"
            }`}
          >
            <Camera className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Shutterstock Login</span>
              <span className="text-xs opacity-90">
                {shutterstockStatus === "connected"
                  ? "Connected"
                  : shutterstockStatus === "loading"
                    ? "Connecting..."
                    : "Not connected"}
              </span>
            </div>
          </Button>
        </div>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
