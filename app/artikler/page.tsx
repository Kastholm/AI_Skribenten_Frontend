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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Calendar, Loader2, CheckCircle, ExternalLink, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

export default function ArtiklerPage() {
  const { user } = useAuth()
  const [url, setUrl] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [validationSuccess, setValidationSuccess] = useState("")
  const [scheduledArticles, setScheduledArticles] = useState<Article[]>([])
  const [unvalidatedArticles, setUnvalidatedArticles] = useState<Article[]>([])
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(true)
  const [isLoadingUnvalidated, setIsLoadingUnvalidated] = useState(true)
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<"scheduled" | "unvalidated">("scheduled")

  // Handle URL validation (no validation, just send to backend)
  const handleValidateUrl = async () => {
    setValidationError("")
    setValidationSuccess("")

    setIsValidating(true)

    try {
      console.log("Sending URL:", url)

      const response = await fetch(`${API_HOST}/articles/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url }),
      })

      if (response.ok) {
        setValidationSuccess("URL validated successfully!")
        setUrl("") // Clear the input
        console.log("URL validation successful for:", url)

        // Refresh articles after validation
        if (activeSiteId) {
          fetchArticles(activeSiteId)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to validate URL" }))
        console.error("Validation error response:", errorData)
        setValidationError(errorData.error || "Failed to validate URL")
      }
    } catch (error) {
      console.error("Error validating URL:", error)
      setValidationError("An error occurred while validating the URL")
    } finally {
      setIsValidating(false)
    }
  }

  // Fetch articles for a specific site
  const fetchArticles = async (siteId: number) => {
    setIsLoadingScheduled(true)
    setIsLoadingUnvalidated(true)

    try {
      // Fetch scheduled articles
      const scheduledResponse = await fetch(`${API_HOST}/articles/scheduled_articles/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (scheduledResponse.ok) {
        const scheduledData = await scheduledResponse.json()
        if (Array.isArray(scheduledData)) {
          // Map articles data from array format to object format
          const formattedScheduledArticles: Article[] = scheduledData.map((articleArray: any[]) => ({
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
            status: articleArray[10] || "unknown",
            created_at: articleArray[11],
          }))
          setScheduledArticles(formattedScheduledArticles)
        }
      }

      // Fetch unvalidated articles
      const unvalidatedResponse = await fetch(`${API_HOST}/articles/unvalidated_articles/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (unvalidatedResponse.ok) {
        const unvalidatedData = await unvalidatedResponse.json()
        if (Array.isArray(unvalidatedData)) {
          // Map articles data from array format to object format
          const formattedUnvalidatedArticles: Article[] = unvalidatedData.map((articleArray: any[]) => ({
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
            status: articleArray[10] || "unvalidated",
            created_at: articleArray[11],
          }))
          setUnvalidatedArticles(formattedUnvalidatedArticles)
        }
      }
    } catch (error) {
      console.error("Error fetching articles:", error)
    } finally {
      setIsLoadingScheduled(false)
      setIsLoadingUnvalidated(false)
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
            fetchArticles(firstSiteId)
          } else {
            setIsLoadingScheduled(false)
            setIsLoadingUnvalidated(false)
          }
        }
      } catch (error) {
        console.error("Error fetching user sites:", error)
        setIsLoadingScheduled(false)
        setIsLoadingUnvalidated(false)
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

  // Get current articles based on active view
  const currentArticles = activeView === "scheduled" ? scheduledArticles : unvalidatedArticles
  const isLoading = activeView === "scheduled" ? isLoadingScheduled : isLoadingUnvalidated

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
                    <BreadcrumbPage>Artikler</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* URL Validation Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Valider Artikel URL</CardTitle>
                <CardDescription>Indtast enhver URL - alle URLs accepteres og behandles af systemet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="url" className="sr-only">
                      URL
                    </Label>
                    <Input
                      id="url"
                      placeholder="Indtast enhver URL..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleValidateUrl()
                        }
                      }}
                    />
                  </div>
                  <Button onClick={handleValidateUrl} disabled={isValidating}>
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validerer...
                      </>
                    ) : (
                      "Valider"
                    )}
                  </Button>
                </div>
                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
                {validationSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{validationSuccess}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Articles Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Artikler</CardTitle>
                    <CardDescription>Oversigt over alle artikler for dit site</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={activeView === "scheduled" ? "default" : "outline"}
                      onClick={() => setActiveView("scheduled")}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Planlagte Artikler
                      <Badge variant="secondary" className="ml-1">
                        {scheduledArticles.length}
                      </Badge>
                    </Button>
                    <Button
                      variant={activeView === "unvalidated" ? "default" : "outline"}
                      onClick={() => setActiveView("unvalidated")}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Ikke Planlagte Artikler
                      <Badge variant="secondary" className="ml-1">
                        {unvalidatedArticles.length}
                      </Badge>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Indlæser artikler...</span>
                  </div>
                ) : currentArticles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    {activeView === "scheduled" ? (
                      <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                    ) : (
                      <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                    )}
                    <p className="text-muted-foreground">
                      {activeView === "scheduled"
                        ? "Ingen planlagte artikler fundet"
                        : "Ingen ikke-planlagte artikler fundet"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Titel</TableHead>
                          <TableHead className="w-[400px]">Teaser</TableHead>
                          <TableHead className="w-[150px]">Status</TableHead>
                          {activeView === "scheduled" && (
                            <TableHead className="w-[180px]">Planlagt Udgivelse</TableHead>
                          )}
                          <TableHead className="w-[150px]">Oprettet</TableHead>
                          <TableHead className="w-[100px]">Link</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentArticles.map((article) => (
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
                            {activeView === "scheduled" && (
                              <TableCell>
                                <div className="text-sm">{formatDate(article.scheduled_publish_at)}</div>
                              </TableCell>
                            )}
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
