"use client"

import type React from "react"

import { useState, useEffect } from "react"
import AdminRoute from "../components/admin-route"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { API_HOST } from "../env"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "../context/auth-context"

type User = {
  id: number
  name: string
  username: string
  role: string
}

type Site = {
  id: number
  name: string
  page_url: string
  description: string
}

type Role = "viewer" | "editor"

export default function LinkUserSitePage() {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedSiteId, setSelectedSiteId] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<Role | "">("")
  const [users, setUsers] = useState<User[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { user } = useAuth()

  // Function to format API error messages
  const formatErrorMessage = (errorData: any): string => {
    if (typeof errorData === "string") {
      return errorData
    }

    if (errorData?.detail) {
      if (Array.isArray(errorData.detail)) {
        return errorData.detail
          .map((err: any) => {
            if (typeof err === "string") return err
            if (err.msg) return `${err.loc?.join(" → ") || "Field"}: ${err.msg}`
            return JSON.stringify(err)
          })
          .join(", ")
      }
      if (typeof errorData.detail === "string") {
        return errorData.detail
      }
    }

    if (errorData?.error) {
      return typeof errorData.error === "string" ? errorData.error : JSON.stringify(errorData.error)
    }

    return "An unknown error occurred"
  }

  // Fetch users and sites on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.role) {
        setError("Bruger rolle ikke tilgængelig")
        setIsLoadingData(false)
        return
      }

      try {
        // Fetch users from /admin/all_users/{role}
        const usersResponse = await fetch(`${API_HOST}/admin/all_users/${user.role}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          console.log("Users response:", usersData)

          if (usersData.success === false) {
            setError(usersData.error || "Ikke autoriseret til at hente brugere")
          } else if (usersData.users && Array.isArray(usersData.users)) {
            // Handle the response structure: {"users": [[id, name, username, password, role], ...]}
            const formattedUsers = usersData.users.map((userArray: any[]) => ({
              id: userArray[0],
              name: userArray[1],
              username: userArray[2],
              // Skip password (userArray[3])
              role: userArray[4],
            }))
            setUsers(formattedUsers)
          } else {
            console.error("Unexpected users data format:", usersData)
            setError("Unexpected users data format")
          }
        } else {
          console.error("Failed to fetch users")
          setError("Failed to load users")
        }

        // Fetch sites from /admin/all_sites/{role}
        const sitesResponse = await fetch(`${API_HOST}/admin/all_sites/${user.role}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (sitesResponse.ok) {
          const sitesData = await sitesResponse.json()
          console.log("Sites response:", sitesData)

          if (sitesData.success === false) {
            setError(sitesData.error || "Ikke autoriseret til at hente sites")
          } else if (sitesData.sites && Array.isArray(sitesData.sites)) {
            // Handle the response structure: {"sites": [[id, name, description, page_url], ...]}
            const formattedSites = sitesData.sites.map((siteArray: any[]) => ({
              id: siteArray[0],
              name: siteArray[1],
              description: siteArray[2],
              page_url: siteArray[3],
            }))
            setSites(formattedSites)
          } else {
            console.error("Unexpected sites data format:", sitesData)
            setError("Unexpected sites data format")
          }
        } else {
          console.error("Failed to fetch sites")
          setError("Failed to load sites")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load users and sites")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [user?.role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!selectedUserId || !selectedSiteId || !selectedRole) {
      setError("Please select a user, site, and role")
      setIsLoading(false)
      return
    }

    try {
      const requestData = {
        user_id: Number.parseInt(selectedUserId),
        site_id: Number.parseInt(selectedSiteId),
        role: selectedRole,
      }

      console.log("Linking user to site with role:", requestData)

      const response = await fetch(`${API_HOST}/sites/link_site`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError)
        setError("Invalid response from server")
        setIsLoading(false)
        return
      }

      console.log("Response data:", data)

      if (response.ok) {
        setSuccess(`User linked to site successfully as ${selectedRole}!`)
        setSelectedUserId("")
        setSelectedSiteId("")
        setSelectedRole("")
      } else {
        const errorMessage = formatErrorMessage(data)
        setError(errorMessage)
      }
    } catch (error) {
      console.error("Link user site error:", error)
      setError("Network error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <AdminRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg">Loading users and sites...</p>
          </div>
        </div>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/">AI Skribenten</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Link User Site</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="mx-auto w-full max-w-md">
              <Card>
                <CardHeader>
                  <CardTitle>Link User to Site</CardTitle>
                  <CardDescription>Associate a user with a specific site and assign their role</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user">Select User</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} ({user.username}) - {user.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="site">Select Site</Label>
                      <Select value={selectedSiteId} onValueChange={setSelectedSiteId} required>
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
                    <div className="space-y-2">
                      <Label htmlFor="role">Select Role</Label>
                      <Select value={selectedRole} onValueChange={(value: Role) => setSelectedRole(value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <strong>Viewer:</strong> Can view site content only
                          <br />
                          <strong>Editor:</strong> Can view and edit site content
                        </AlertDescription>
                      </Alert>
                    </div>
                    {error && <p className="text-sm font-medium text-red-500">{error}</p>}
                    {success && <p className="text-sm font-medium text-green-500">{success}</p>}
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !selectedUserId || !selectedSiteId || !selectedRole}
                    >
                      {isLoading ? "Linking..." : "Link User to Site"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminRoute>
  )
}
