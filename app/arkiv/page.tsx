"use client"

import { useState, useEffect } from "react"
import ProtectedRoute from "../components/protected-route"
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
import { useAuth } from "../context/auth-context"
import { API_HOST } from "../env"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Archive, Loader2, ExternalLink, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PublishedArticle = {
  id: number
  site_id: number
  title: string
  teaser: string
  content: string
  img: string
  status: string
  response: string
  scheduled_publish_at: string | null
  published_at: string | null
  url: string
  prompt_instruction: string
  instructions: string
  user_id: number
  created_at: string
  updated_at: string
}

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

export default function ArkivPage() {
  const { user } = useAuth()
  const [publishedArticles, setPublishedArticles] = useState<PublishedArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null)
  const [activeSite, setActiveSite] = useState<Site | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])

  // Fetch published articles for a specific site
  const fetchPublishedArticles = async (siteId: number) => {
    setIsLoading(true)

    try {
      const response = await fetch(`${API_HOST}/articles/get_published_articles/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          const formattedArticles: PublishedArticle[] = data.map((articleArray: any[]) => ({
            id: articleArray[0],
            site_id: articleArray[1],
            title: articleArray[2],
            teaser: articleArray[3],
            content: articleArray[4],
            img: articleArray[5],
            status: articleArray[6],
            response: articleArray[7],
            scheduled_publish_at: articleArray[8],
            published_at: articleArray[9],
            url: articleArray[10],
            prompt_instruction: articleArray[11],
            instructions: articleArray[12],
            user_id: articleArray[13],
            created_at: articleArray[14],
            updated_at: articleArray[15],
          }))
          setPublishedArticles(formattedArticles)
        }
      } else {
        console.error("Failed to fetch published articles")
      }
    } catch (error) {
      console.error("Error fetching published articles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all users
  const fetchAllUsers = async () => {
    if (!user?.role) {
      console.error("User role not available")
      return
    }

    try {
      const response = await fetch(`${API_HOST}/admin/all_users/${user.role}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const usersData = await response.json()
        if (usersData.success === false) {
          console.error("Not authorized to fetch users:", usersData.error)
        } else if (usersData.users && Array.isArray(usersData.users)) {
          const formattedUsers: User[] = usersData.users.map((userArray: any[]) => ({
            id: userArray[0],
            name: userArray[1],
            username: userArray[2],
            role: userArray[4],
          }))
          setAllUsers(formattedUsers)
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  // Fetch user sites
  const fetchUserSites = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`${API_HOST}/users/sites/${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.sites && Array.isArray(data.sites) && data.sites.length > 0) {
          const formattedSites: Site[] = data.sites.map((siteArray: any[]) => ({
            id: siteArray[0],
            name: siteArray[1],
            description: siteArray[2],
            page_url: siteArray[3],
          }))

          // Set first site as active by default if no active site is set
          if (!activeSiteId && formattedSites.length > 0) {
            const firstSite = formattedSites[0]
            setActiveSiteId(firstSite.id)
            setActiveSite(firstSite)
            fetchPublishedArticles(firstSite.id)
          }
        } else {
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error("Error fetching user sites:", error)
      setIsLoading(false)
    }
  }

  // Listen for site changes from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const storedActiveSite = localStorage.getItem("activeSite")
      if (storedActiveSite) {
        try {
          const siteData = JSON.parse(storedActiveSite)
          if (siteData.id !== activeSiteId) {
            setActiveSiteId(siteData.id)
            setActiveSite(siteData)
            fetchPublishedArticles(siteData.id)
          }
        } catch (error) {
          console.error("Error parsing stored active site:", error)
        }
      }
    }

    // Listen for storage changes
    window.addEventListener("storage", handleStorageChange)
    // Also listen for custom events (for same-tab changes)
    window.addEventListener("activeSiteChanged", handleStorageChange)
    // Check for stored active site on mount
    handleStorageChange()

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("activeSiteChanged", handleStorageChange)
    }
  }, [activeSiteId])

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchUserSites()
      fetchAllUsers()
    }
  }, [user?.id])

  // Format date string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Ikke angivet"

    const date = new Date(dateString)
    if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
      return "Ugyldig dato"
    }

    return date.toLocaleDateString("da-DK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get user name by ID
  const getUserName = (userId: number) => {
    const foundUser = allUsers.find((u) => u.id === userId)
    return foundUser ? foundUser.name : `Bruger ${userId}`
  }

  // Open URL in new window
  const openUrl = (url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <ProtectedRoute>
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
                    <BreadcrumbPage>Arkiv {activeSite && `- ${activeSite.name}`}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Published Articles Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Archive className="h-5 w-5" />
                      Publicerede Artikler
                      {activeSite && (
                        <span className="text-sm font-normal text-muted-foreground">for {activeSite.name}</span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Arkiv over alle publicerede artikler for {activeSite?.name || "dit site"}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {publishedArticles.length} artikler
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Indlæser publicerede artikler...</span>
                  </div>
                ) : publishedArticles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Archive className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Ingen publicerede artikler fundet for {activeSite?.name || "dette site"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Status</TableHead>
                          <TableHead className="w-[300px]">Titel</TableHead>
                          <TableHead className="w-[100px]">Bruger</TableHead>
                          <TableHead className="w-[120px]">Oprettet</TableHead>
                          <TableHead className="w-[150px]">Publiceret</TableHead>
                          <TableHead className="w-[100px]">Link</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {publishedArticles.map((article) => (
                          <TableRow key={article.id}>
                            <TableCell>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="max-w-[280px] truncate" title={article.title}>
                                {article.title}
                              </div>
                              {article.teaser && (
                                <div
                                  className="text-xs text-muted-foreground max-w-[280px] truncate mt-1"
                                  title={article.teaser}
                                >
                                  {article.teaser}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{getUserName(article.user_id)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">{formatDate(article.created_at)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{formatDate(article.published_at)}</div>
                            </TableCell>
                            <TableCell>
                              {article.url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openUrl(article.url)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                                  title="Åbn artikel URL"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
