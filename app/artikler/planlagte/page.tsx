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
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Loader2,
  ExternalLink,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditArticleDialog } from "@/components/edit-article-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Article = {
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
  category_id: number
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

export default function PlanlagteArtiklerPage() {
  const { user } = useAuth()
  const [scheduledArticles, setScheduledArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null)
  const [activeSite, setActiveSite] = useState<Site | null>(null)
  const [userSites, setUserSites] = useState<Site[]>([])
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [isPublishing, setIsPublishing] = useState<number | null>(null)

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
          const formattedArticles: Article[] = data.map((articleArray: any[]) => ({
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
            category_id: articleArray[14],
            created_at: articleArray[15],
            updated_at: articleArray[16],
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

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${API_HOST}/users/info`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const usersData = await response.json()
        if (usersData.users && Array.isArray(usersData.users)) {
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

          setUserSites(formattedSites)

          // Set first site as active by default if no active site is set
          if (!activeSiteId && formattedSites.length > 0) {
            const firstSite = formattedSites[0]
            setActiveSiteId(firstSite.id)
            setActiveSite(firstSite)
            fetchScheduledArticles(firstSite.id)
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
            fetchScheduledArticles(siteData.id)
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
    if (!dateString) return "Ikke planlagt"

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

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "validating":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "queued":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "scheduled":
        return <Calendar className="h-4 w-4 text-blue-500" />
      case "published":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  // Get user name by ID
  const getUserName = (userId: number) => {
    const foundUser = allUsers.find((u) => u.id === userId)
    return foundUser ? foundUser.name : `Bruger ${userId}`
  }

  // Handle edit article
  const handleEditArticle = (article: Article) => {
    setEditingArticle(article)
    setIsEditDialogOpen(true)
  }

  // Handle delete article
  const handleDeleteArticle = (article: Article) => {
    setDeletingArticle(article)
    setIsDeleteDialogOpen(true)
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingArticle) return

    setIsDeleting(true)

    try {
      const response = await fetch(`${API_HOST}/articles/delete_article/${deletingArticle.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        if (activeSiteId) {
          fetchScheduledArticles(activeSiteId)
        }
      }
    } catch (error) {
      console.error("Error deleting article:", error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setDeletingArticle(null)
    }
  }

  // Handle save from edit dialog
  const handleSaveArticle = () => {
    if (activeSiteId) {
      fetchScheduledArticles(activeSiteId)
    }
  }

  // Open URL in new window
  const openUrl = (url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  // Handle publish article
  const handlePublishArticle = async (article: Article) => {
    setIsPublishing(article.id)

    try {
      const publishData = {
        site_id: article.site_id,
        title: article.title,
        teaser: article.teaser,
        content: article.content,
        img: article.img,
        prompt_instructions: article.prompt_instruction,
        instructions: article.instructions,
        user_id: article.user_id,
        category_id: article.category_id,
      }

      console.log("Publishing article:", publishData)

      const response = await fetch(`${API_HOST}/articles/write_article`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(publishData),
      })

      if (response.ok) {
        console.log("Article published successfully")
        if (activeSiteId) {
          fetchScheduledArticles(activeSiteId)
        }
      } else {
        console.error("Failed to publish article:", await response.text())
      }
    } catch (error) {
      console.error("Error publishing article:", error)
    } finally {
      setIsPublishing(null)
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
                    <BreadcrumbLink href="/artikler">Artikler</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Planlagte Artikler {activeSite && `- ${activeSite.name}`}</BreadcrumbPage>
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
                      {activeSite && (
                        <span className="text-sm font-normal text-muted-foreground">for {activeSite.name}</span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Oversigt over alle planlagte artikler for {activeSite?.name || "dit site"}
                    </CardDescription>
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
                    <p className="text-muted-foreground">
                      Ingen planlagte artikler fundet for {activeSite?.name || "dette site"}
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
                          <TableHead className="w-[150px]">Planlagt</TableHead>
                          <TableHead className="w-[150px]">Handlinger</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheduledArticles.map((article) => (
                          <TableRow key={article.id}>
                            <TableCell>{getStatusIcon(article.status)}</TableCell>
                            <TableCell className="font-medium">
                              <div className="max-w-[280px] truncate" title={article.title}>
                                {article.title}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{getUserName(article.user_id)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">{formatDate(article.created_at)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{formatDate(article.scheduled_publish_at)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteArticle(article)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                  title="Slet artikel"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditArticle(article)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  title="Rediger artikel"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
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
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handlePublishArticle(article)}
                                  disabled={isPublishing === article.id}
                                  className="ml-2 bg-green-600 hover:bg-green-700 text-white rounded-full px-4"
                                  title="Udgiv artikel"
                                >
                                  {isPublishing === article.id ? (
                                    <>
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                      Udgiver...
                                    </>
                                  ) : (
                                    "Publish"
                                  )}
                                </Button>
                              </div>
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

      {/* Edit Article Dialog */}
      <EditArticleDialog
        article={editingArticle}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingArticle(null)
        }}
        onSave={handleSaveArticle}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet Artikel</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette artiklen "{deletingArticle?.title}"? Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sletter...
                </>
              ) : (
                "Slet"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}
