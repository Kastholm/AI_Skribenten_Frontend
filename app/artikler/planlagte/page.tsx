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
import { Calendar, Loader2, Edit, Trash2, AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

interface Article {
  id: number
  title: string
  teaser: string
  url: string
  status: string
  created_at: string
}

interface User {
  id: number
  name: string
  username: string
  role: string
}

interface Site {
  id: number
  name: string
  page_url: string
  description: string
}

export default function PlanlagteArtiklerPage() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [userSites, setUserSites] = useState<Site[]>([])
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null)
  const [activeSite, setActiveSite] = useState<Site | null>(null)

  useEffect(() => {
    const fetchScheduledArticles = async () => {
      try {
        const response = await fetch(`${API_HOST}/articles/scheduled`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setArticles(data.articles || [])
        } else {
          console.error("Failed to fetch scheduled articles")
        }
      } catch (error) {
        console.error("Error fetching scheduled articles:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchScheduledArticles()
  }, [])

  const handleDelete = async (articleId: number) => {
    try {
      const response = await fetch(`${API_HOST}/articles/${articleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        setArticles(articles.filter((article) => article.id !== articleId))
      } else {
        console.error("Failed to delete article")
      }
    } catch (error) {
      console.error("Error deleting article:", error)
    }
  }

  const handleEdit = (article: Article) => {
    setEditingArticle(article)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async (updatedArticle: Article) => {
    try {
      const response = await fetch(`${API_HOST}/articles/${updatedArticle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: updatedArticle.title,
          teaser: updatedArticle.teaser,
          url: updatedArticle.url,
        }),
      })

      if (response.ok) {
        setArticles(articles.map((article) => (article.id === updatedArticle.id ? updatedArticle : article)))
      } else {
        console.error("Failed to update article")
      }
    } catch (error) {
      console.error("Error updating article:", error)
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

          setUserSites(formattedSites)

          // Set first site as active by default if no active site is set
          if (!activeSiteId && formattedSites.length > 0) {
            const firstSite = formattedSites[0]
            setActiveSiteId(firstSite.id)
            setActiveSite(firstSite)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user sites:", error)
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
                    {articles.length} artikler
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Indlæser planlagte artikler...</span>
                  </div>
                ) : articles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Ingen planlagte artikler fundet for {activeSite?.name || "dette site"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="space-y-4">
                      {articles.map((article) => (
                        <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-semibold">{article.title}</h3>
                            <p className="text-sm text-muted-foreground">{article.teaser}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{article.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(article.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(article)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(article.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
        onSave={handleSaveEdit}
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
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
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
