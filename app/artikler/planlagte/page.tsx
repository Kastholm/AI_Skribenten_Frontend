"use client"

import { useState, useEffect } from "react"
import ProtectedRoute from "../../components/protected-route"
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
import { useAuth } from "../../context/auth-context"
import { API_HOST } from "../../env"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Loader2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Article = {
  id: number
  title: string
  teaser: string
  content: string
  img: string
  url: string
  site_id: number
  user_id: number
  category_id: number
  scheduled_publish_at: string | null
  status: string
  created_at: string
}

export default function PlanlagteArtiklerPage() {
  const { user } = useAuth()
  const [scheduledArticles, setScheduledArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null)

  // Fetch scheduled articles for a specific site
  const fetchScheduledArticles = async (siteId: number) => {
    setIsLoading(true)

    try {
      const response = await fetch(`${API_HOST}/articles/scheduled_articles/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          // Map articles data from array format to object format
          const formattedArticles: Article[] = data.map((articleArray: any[]) => ({
            id: articleArray[0],
            title: articleArray[1],
            teaser: articleArray[2],
            content: articleArray[3],
            img: articleArray[4],
            url: articleArray[5],
            site_id: articleArray[6],
            user_id: articleArray[7],
            category_id: articleArray[8],
            scheduled_publish_at: articleArray[9],
            status: articleArray[10] || "scheduled",
            created_at: articleArray[11],
          }))
          setScheduledArticles(formattedArticles)
        }
      }
    } catch (error) {
      console.error("Error fetching scheduled articles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get active site ID from user's sites
  useEffect(() => {
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
            // Use the first site for now
            const firstSiteId = data.sites[0][0] // First site's ID
            setActiveSiteId(firstSiteId)
            fetchScheduledArticles(firstSiteId)
          } else {
            setIsLoading(false)
          }
        }
      } catch (error) {
        console.error("Error fetching user sites:", error)
        setIsLoading(false)
      }
    }

    fetchUserSites()
  }, [user?.id])

  // Format date string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Ikke planlagt"
    const date = new Date(dateString)
    return date.toLocaleDateString("da-DK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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
                    <BreadcrumbLink href="/artikler">Artikler</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Planlagte Artikler</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Scheduled Articles Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Planlagte Artikler
                    </CardTitle>
                    <CardDescription>Oversigt over alle planlagte artikler for dit site</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {scheduledArticles.length} artikler
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Indlæser planlagte artikler...</span>
                  </div>
                ) : scheduledArticles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Ingen planlagte artikler fundet</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Titel</TableHead>
                          <TableHead className="w-[400px]">Teaser</TableHead>
                          <TableHead className="w-[150px]">Status</TableHead>
                          <TableHead className="w-[180px]">Planlagt Udgivelse</TableHead>
                          <TableHead className="w-[150px]">Oprettet</TableHead>
                          <TableHead className="w-[100px]">Link</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheduledArticles.map((article) => (
                          <TableRow key={article.id}>
                            <TableCell className="font-medium">
                              <div className="max-w-[280px] truncate" title={article.title}>
                                {article.title}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[380px] truncate text-muted-foreground" title={article.teaser}>
                                {article.teaser}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  article.status === "published"
                                    ? "default"
                                    : article.status === "scheduled"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {article.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{formatDate(article.scheduled_publish_at)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {new Date(article.created_at).toLocaleDateString("da-DK")}
                              </div>
                            </TableCell>
                            <TableCell>
                              {article.url && (
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Se
                                </a>
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
