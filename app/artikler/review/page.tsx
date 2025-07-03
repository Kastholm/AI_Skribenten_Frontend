"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Search, Plus, Edit, Trash2, CheckCircle } from "lucide-react"
import { useAuth } from "@/app/context/auth-context"
import { API_HOST } from "@/app/env"
import { EditArticleDialog } from "@/components/edit-article-dialog"
import { ArticleCard } from "@/components/article-card"
import { ViewToggle } from "@/components/view-toggle"

type Article = {
  id: number
  title: string
  content: string
  teaser: string
  status: string
  created_at: string
  site_id: number
  user_id: number
  image_url?: string
}

type User = {
  id: number
  name: string
  username: string
  role: string
}

export default function ReviewPage() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "card">("card") // Default to card view for review

  // URL validation states
  const [url, setUrl] = useState("")
  const [validationType, setValidationType] = useState<"article" | "sitemap">("article")
  const [isValidating, setIsValidating] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")

  const fetchArticles = async () => {
    try {
      const response = await fetch(`${API_HOST}/articles/review`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Review articles response:", data)

        if (data.articles && Array.isArray(data.articles)) {
          const formattedArticles: Article[] = data.articles.map((articleArray: any[]) => ({
            id: articleArray[0],
            title: articleArray[1],
            content: articleArray[2],
            teaser: articleArray[3],
            status: articleArray[4],
            created_at: articleArray[5],
            site_id: articleArray[6],
            user_id: articleArray[7],
            image_url: articleArray[8] || undefined,
          }))

          setArticles(formattedArticles)
        }
      } else {
        console.error("Failed to fetch review articles")
      }
    } catch (error) {
      console.error("Error fetching review articles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    if (!user?.role) {
      console.log("User role not available") // Changed from error to log
      return
    }

    try {
      const response = await fetch(`${API_HOST}/users/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("All users response:", data)

        if (data.users && Array.isArray(data.users)) {
          const formattedUsers: User[] = data.users.map((userArray: any[]) => ({
            id: userArray[0],
            name: userArray[1],
            username: userArray[2],
            role: userArray[3],
          }))

          setUsers(formattedUsers)
        }
      } else {
        console.error("Failed to fetch users")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  useEffect(() => {
    fetchArticles()
    fetchAllUsers()
  }, [user?.role]) // Added user.role to dependency array

  const handleValidateUrl = async () => {
    if (!url.trim()) {
      setValidationMessage("Please enter a URL")
      return
    }

    if (!user?.id) {
      setValidationMessage("User not authenticated")
      return
    }

    setIsValidating(true)
    setValidationMessage("")

    try {
      const response = await fetch(`${API_HOST}/articles/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          site_id: 1, // You might want to make this dynamic
          user_id: user.id,
          type: validationType, // Send the selected type
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setValidationMessage(data.message || "URL validated successfully")
        setUrl("") // Clear the input after successful validation

        // Refresh articles to show any new ones
        fetchArticles()
      } else {
        const errorData = await response.json()
        setValidationMessage(errorData.detail || "Validation failed")
      }
    } catch (error) {
      console.error("Error validating URL:", error)
      setValidationMessage("Error validating URL")
    } finally {
      setIsValidating(false)
    }
  }

  const handleDeleteArticle = async (articleId: number) => {
    try {
      const response = await fetch(`${API_HOST}/articles/${articleId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
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

  const handlePublishArticle = async (articleId: number) => {
    try {
      const response = await fetch(`${API_HOST}/articles/write_article`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          article_id: articleId,
        }),
      })

      if (response.ok) {
        // Remove the article from the current list since it's now published
        setArticles(articles.filter((article) => article.id !== articleId))
      } else {
        console.error("Failed to publish article")
      }
    } catch (error) {
      console.error("Error publishing article:", error)
    }
  }

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article)
    setIsEditDialogOpen(true)
  }

  const handleSaveArticle = async (updatedArticle: Article) => {
    try {
      const response = await fetch(`${API_HOST}/articles/${updatedArticle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: updatedArticle.title,
          content: updatedArticle.content,
          teaser: updatedArticle.teaser,
        }),
      })

      if (response.ok) {
        setArticles(articles.map((article) => (article.id === updatedArticle.id ? updatedArticle : article)))
        setIsEditDialogOpen(false)
        setEditingArticle(null)
      } else {
        console.error("Failed to update article")
      }
    } catch (error) {
      console.error("Error updating article:", error)
    }
  }

  // Filter articles based on search term and selected user
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.teaser.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesUser = selectedUser === "all" || article.user_id.toString() === selectedUser

    return matchesSearch && matchesUser
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Review Artikler</h2>
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* URL Validation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Tilføj Artikel via URL
          </CardTitle>
          <CardDescription>Indtast en URL for at validere og tilføje en artikel til review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleValidateUrl()
                }
              }}
            />
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Type:</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={validationType === "article"}
                  onChange={() => setValidationType("article")}
                  className="rounded"
                />
                <span>Article</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={validationType === "sitemap"}
                  onChange={() => setValidationType("sitemap")}
                  className="rounded"
                />
                <span>Sitemap</span>
              </label>
            </div>
          </div>

          <Button onClick={handleValidateUrl} disabled={isValidating} className="w-full">
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validerer...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Valider URL
              </>
            )}
          </Button>

          {validationMessage && (
            <div className={`text-sm ${validationMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {validationMessage}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søg artikler..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {users.length > 0 && (
          <div className="w-full sm:w-48">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">Alle brugere</option>
              {users.map((user) => (
                <option key={user.id} value={user.id.toString()}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Articles Display */}
      {viewMode === "table" ? (
        <Card>
          <CardHeader>
            <CardTitle>Review Artikler ({filteredArticles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredArticles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Ingen artikler fundet</div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{article.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{article.teaser}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{article.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(article.created_at).toLocaleDateString("da-DK")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditArticle(article)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteArticle(article.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePublishArticle(article.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Publicer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Review Artikler ({filteredArticles.length})</h3>
          </div>

          {filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">Ingen artikler fundet</CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onEdit={() => handleEditArticle(article)}
                  onDelete={() => handleDeleteArticle(article.id)}
                  showPublishButton={true}
                  onPublish={() => handlePublishArticle(article.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <EditArticleDialog
        article={editingArticle}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingArticle(null)
        }}
        onSave={handleSaveArticle}
      />
    </div>
  )
}
