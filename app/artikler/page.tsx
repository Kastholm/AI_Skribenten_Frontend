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
import { AlertCircle, Calendar, Clock, Loader2, CheckCircle, ExternalLink, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  created_at: string
}

export default function ArtiklerPage() {
  const { user } = useAuth()
  const [url, setUrl] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [validationSuccess, setValidationSuccess] = useState("")
  const [todaysArticles, setTodaysArticles] = useState<Article[]>([])
  const [weekArticles, setWeekArticles] = useState<Article[]>([])
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [isLoadingToday, setIsLoadingToday] = useState(true)
  const [isLoadingWeek, setIsLoadingWeek] = useState(true)
  const [isLoadingAll, setIsLoadingAll] = useState(true)
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("scheduled")

  // URL validation function
  const isValidUrl = (url: string): boolean => {
    // Remove protocol and www if present
    let cleanUrl = url.toLowerCase().trim()
    cleanUrl = cleanUrl.replace(/^https?:\/\//, "")
    cleanUrl = cleanUrl.replace(/^www\./, "")

    // Check if it contains a valid domain with TLD, allowing paths after
    // This regex checks for: domain.tld followed by optional path
    const urlPattern =
      /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.(com|org|net|edu|gov|mil|int|dk|de|uk|fr|es|it|nl|se|no|fi|pl|ru|jp|cn|au|ca|br|mx|ar|cl|co|pe|ve|ec|bo|py|uy|gf|sr|gy|fk|gs|sh|ac|io|ai|ag|bb|bz|dm|gd|gy|ht|jm|kn|lc|ms|tc|tt|vc|vg|vi|as|ck|fj|fm|gu|ki|mh|mp|nc|nf|nr|nu|pf|pg|pn|pw|sb|tk|to|tv|vu|wf|ws|cc|cx|hm|nz|tf|aq)(\/.*)?$/

    return urlPattern.test(cleanUrl)
  }

  // Handle URL validation
  const handleValidateUrl = async () => {
    setValidationError("")
    setValidationSuccess("")

    if (!url.trim()) {
      setValidationError("Please enter a URL")
      return
    }

    if (!isValidUrl(url)) {
      setValidationError("Please enter a valid URL with a proper domain (e.g., example.com, site.dk)")
      return
    }

    setIsValidating(true)

    try {
      // Encode the URL to handle special characters
      const encodedUrl = encodeURIComponent(url)
      const response = await fetch(`${API_HOST}/articles/validate/${encodedUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setValidationSuccess("URL validated successfully!")
        console.log("URL validation successful for:", url)
      } else {
        const errorData = await response.json()
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
    try {
      // Fetch today's articles
      const todayResponse = await fetch(`${API_HOST}/articles/todays_articles/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (todayResponse.ok) {
        const todayData = await todayResponse.json()
        if (Array.isArray(todayData)) {
          // Map articles data from array format to object format
          const formattedTodayArticles: Article[] = todayData.map((articleArray: any[]) => ({
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
            created_at: articleArray[10],
          }))
          setTodaysArticles(formattedTodayArticles)
        }
      }

      // Fetch week's articles
      const weekResponse = await fetch(`${API_HOST}/articles/week_articles/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (weekResponse.ok) {
        const weekData = await weekResponse.json()
        if (Array.isArray(weekData)) {
          // Map articles data from array format to object format
          const formattedWeekArticles: Article[] = weekData.map((articleArray: any[]) => ({
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
            created_at: articleArray[10],
          }))
          setWeekArticles(formattedWeekArticles)
        }
      }

      // Fetch all articles
      const allResponse = await fetch(`${API_HOST}/articles/all_articles/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (allResponse.ok) {
        const allData = await allResponse.json()
        if (Array.isArray(allData)) {
          // Map articles data from array format to object format
          const formattedAllArticles: Article[] = allData.map((articleArray: any[]) => ({
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
            created_at: articleArray[10],
          }))

          // Filter articles without scheduled_publish_at
          const unscheduledArticles = formattedAllArticles.filter((article) => !article.scheduled_publish_at)
          setAllArticles(unscheduledArticles)
        }
      }
    } catch (error) {
      console.error("Error fetching articles:", error)
    } finally {
      setIsLoadingToday(false)
      setIsLoadingWeek(false)
      setIsLoadingAll(false)
    }
  }

  // Get active site ID from user's sites (for now, we'll use the first site)
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
            setIsLoadingToday(false)
            setIsLoadingWeek(false)
            setIsLoadingAll(false)
          }
        }
      } catch (error) {
        console.error("Error fetching user sites:", error)
        setIsLoadingToday(false)
        setIsLoadingWeek(false)
        setIsLoadingAll(false)
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
                <CardDescription>Indtast en URL for at validere og behandle artiklen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="url" className="sr-only">
                      URL
                    </Label>
                    <Input
                      id="url"
                      placeholder="https://example.com/artikel"
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

            {/* Articles Tabs */}
            <Tabs defaultValue="scheduled" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="scheduled">Planlagte Artikler</TabsTrigger>
                <TabsTrigger value="unscheduled">Ikke-Planlagte Artikler</TabsTrigger>
              </TabsList>

              {/* Scheduled Articles Tab */}
              <TabsContent value="scheduled" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Today's Articles */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Dagens Artikler
                      </CardTitle>
                      <CardDescription>Artikler planlagt til i dag</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingToday ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : todaysArticles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">Ingen artikler planlagt til i dag</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[250px] pr-4">
                          <div className="space-y-2">
                            {todaysArticles.map((article) => (
                              <Card key={article.id} className="p-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm leading-tight truncate">{article.title}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                      {article.teaser}
                                    </p>
                                    {article.url && (
                                      <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        Se artikel
                                      </a>
                                    )}
                                  </div>
                                  <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                                    {formatDate(article.scheduled_publish_at)}
                                  </Badge>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>

                  {/* Week's Articles */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Ugens Artikler
                      </CardTitle>
                      <CardDescription>Artikler planlagt for denne uge</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingWeek ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : weekArticles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <Clock className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">Ingen artikler planlagt for denne uge</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[250px] pr-4">
                          <div className="space-y-2">
                            {weekArticles.map((article) => (
                              <Card key={article.id} className="p-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm leading-tight truncate">{article.title}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                      {article.teaser}
                                    </p>
                                    {article.url && (
                                      <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        Se artikel
                                      </a>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="ml-2 text-xs shrink-0">
                                    {formatDate(article.scheduled_publish_at)}
                                  </Badge>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Unscheduled Articles Tab */}
              <TabsContent value="unscheduled">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Ikke-Planlagte Artikler
                    </CardTitle>
                    <CardDescription>Artikler uden planlagt udgivelsesdato</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingAll ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : allArticles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Ingen ikke-planlagte artikler fundet</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {allArticles.map((article) => (
                            <Card key={article.id} className="p-2">
                              <div className="space-y-1">
                                <h4 className="font-medium text-sm leading-tight truncate">{article.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-1">{article.teaser}</p>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">
                                    Oprettet: {new Date(article.created_at).toLocaleDateString("da-DK")}
                                  </Badge>
                                  {article.url && (
                                    <a
                                      href={article.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Se artikel
                                    </a>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
