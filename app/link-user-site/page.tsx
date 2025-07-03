"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import ProtectedRoute from "@/app/components/protected-route"
import AdminRoute from "@/app/components/admin-route"
import { API_HOST } from "@/app/env"

interface User {
  id: number
  username: string
  name: string
  role: string
}

interface Site {
  id: number
  name: string
  page_url: string
  description: string
}

export default function LinkUserSitePage() {
  const [users, setUsers] = useState<User[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedSiteId, setSelectedSiteId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Fetch users and sites
    const fetchData = async () => {
      try {
        const [usersResponse, sitesResponse] = await Promise.all([
          fetch(`${API_HOST}/users/all`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          fetch(`${API_HOST}/sites/all`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ])

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.users || [])
        }

        if (sitesResponse.ok) {
          const sitesData = await sitesResponse.json()
          setSites(sitesData.sites || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${API_HOST}/users/link-site`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          user_id: Number.parseInt(selectedUserId),
          site_id: Number.parseInt(selectedSiteId),
        }),
      })

      if (response.ok) {
        setMessage("User linked to site successfully!")
        setSelectedUserId("")
        setSelectedSiteId("")
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.detail || "Failed to link user to site"}`)
      }
    } catch (error) {
      setMessage("Error: Failed to link user to site")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <AdminRoute>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <div className="mx-auto w-full max-w-md">
                <Card>
                  <CardHeader>
                    <CardTitle>Link User to Site</CardTitle>
                    <CardDescription>Connect a user to a specific site for content management</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="user">Select User</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} ({user.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="site">Select Site</Label>
                        <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a site" />
                          </SelectTrigger>
                          <SelectContent>
                            {sites.map((site) => (
                              <SelectItem key={site.id} value={site.id.toString()}>
                                {site.name} ({site.page_url})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {message && (
                        <div className={`text-sm ${message.includes("Error") ? "text-red-500" : "text-green-500"}`}>
                          {message}
                        </div>
                      )}
                      <Button type="submit" className="w-full" disabled={loading || !selectedUserId || !selectedSiteId}>
                        {loading ? "Linking..." : "Link User to Site"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AdminRoute>
    </ProtectedRoute>
  )
}
