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
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "validating":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "queued":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "scheduled":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
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
        // Refresh articles list
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
    window.open(url, "_blank", "noopener,noreferrer")
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
                              <div className="text-sm">Bruger {article.user_id}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {new Date(article.created_at).toLocaleDateString("da-DK")}
                              </div>
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
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditArticle(article)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {article.url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openUrl(article.url)}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
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
