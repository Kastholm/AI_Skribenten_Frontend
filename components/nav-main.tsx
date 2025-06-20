"use client"

import { SidebarGroupLabel } from "@/components/ui/sidebar"

import { useState, useEffect } from "react"
import { API_HOST } from "@/app/env"
import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function NavMain() {
  const pathname = usePathname()

  const [isShutterstockAuthenticated, setIsShutterstockAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check Shutterstock authentication status on component mount
  useEffect(() => {
    checkShutterstockAuth()
  }, [])

  const checkShutterstockAuth = async () => {
    try {
      // For now, we'll assume not authenticated until we implement token storage
      setIsShutterstockAuthenticated(false)
    } catch (error) {
      console.error("Error checking Shutterstock auth:", error)
      setIsShutterstockAuthenticated(false)
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const handleShutterstockLogin = async () => {
    try {
      const response = await fetch(`${API_HOST}/auth/start-auth`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.auth_url) {
          // Redirect to Shutterstock auth URL
          window.location.href = data.auth_url
        }
      } else {
        console.error("Failed to start Shutterstock auth")
      }
    } catch (error) {
      console.error("Error starting Shutterstock auth:", error)
    }
  }

  return (
    <Sidebar className="bg-secondary">
      <SidebarGroup>
        <SidebarItem href="/dashboard" label="Dashboard" icon="home" />
        <SidebarItem href="/transactions" label="Transactions" icon="activity" />
        <SidebarItem href="/billing" label="Billing" icon="credit-card" />
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Settings</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <div className="flex items-center gap-2 w-full">
                <span>Profile</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <div className="flex items-center gap-2 w-full">
                <span>Account</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* Shutterstock Authentication */}
      <SidebarGroup>
        <SidebarGroupLabel>Integrations</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleShutterstockLogin}
              className={`w-full justify-start ${
                isShutterstockAuthenticated
                  ? "text-green-600 hover:text-green-700"
                  : "text-orange-600 hover:text-orange-700"
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isCheckingAuth
                      ? "bg-gray-400 animate-pulse"
                      : isShutterstockAuthenticated
                        ? "bg-green-500"
                        : "bg-orange-500"
                  }`}
                />
                <span>Shutterstock Login</span>
                {isShutterstockAuthenticated && <span className="text-xs text-green-600 ml-auto">✓</span>}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </Sidebar>
  )
}
