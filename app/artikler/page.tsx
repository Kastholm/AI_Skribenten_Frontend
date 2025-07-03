"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, CheckCircle } from "lucide-react"
import { EditArticleDialog } from "@/components/edit-article-dialog"
import ProtectedRoute from "@/app/components/protected-route"
import { API_HOST } from "@/app/env"
import { useAuth } from "@/app/context/auth-context"

interface Article {
  id: number
  title: string
  teaser: string
  url: string
  status: string
  created_at: string
}

export default function ArtiklerPage() {
  const { user } = useAuth()
  const [url, setUrl] = useState("")
  const [validationType, setValidationType] = useState<"article" | "sitemap">("article")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [articles, setArticles] = useState<Article[]>([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Fetch all articles
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(`${API_HOST}/articles/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setArticles(data.articles || [])
        } else {
          console.error("Failed to fetch articles")
        }
      } catch (error) {
        console.error("Error fetching articles:", error)
      } finally {
        setLoadingArticles(false)
      }
    }

    fetchArticles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${API_HOST}/articles/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          url: url,
          site_id: 1, // You might want to get this from context or props
          user_id: user?.id,
          type: validationType,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(`Success: ${result.message || "URL validated successfully"}`)
        setUrl("")
        // Refresh the articles list
        window.location.reload()
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.detail || "Failed to validate URL"}`)
      }
    } catch (error) {
      setMessage("Error: Failed to validate URL")
    } finally {
      setLoading(false)
    }
  }

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

  const handleApprove = async (articleId: number) => {
    try {
      const response = await fetch(`${API_HOST}/articles/${articleId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        // Update article status
        setArticles(
          articles.map((article) => (article.id === articleId ? { ...article, status: "approved" } : article)),
        )
      } else {
        console.error("Failed to approve article")
      }
    } catch (error) {
      console.error("Error approving article:", error)
    }
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div>
              <h1 className="text-3xl font-bold">Artikler</h1>
              <p className="text-muted-foreground">Administrer alle artikler og valider nye URLs</p>
            </div>

            {/* URL Validation Section */}
            <Card>
              <CardHeader>
                <CardTitle>Valider URL</CardTitle>
                <CardDescription>Indtast en URL for at validere og oprette en ny artikel</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      required
                    />
                  </div>

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

                  {message && (
                    <div className={`text-sm ${message.includes("Error") ? "text-red-500" : "text-green-500"}`}>
                      {message}
                    </div>
                  )}
                  <Button type="submit" disabled={loading}>
                    {loading ? "Validerer..." : "Valider URL"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Articles List */}
            <Card>
              <CardHeader>
                <CardTitle>Alle Artikler</CardTitle>
                <CardDescription>Oversigt over alle artikler i systemet</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingArticles ? (
                  <div>Loading articles...</div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Ingen artikler fundet</div>
                ) : (
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
                          {article.status === "pending" && (
                            <Button variant="outline" size="sm" onClick={() => handleApprove(article.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleDelete(article.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <EditArticleDialog
              article={editingArticle}
              isOpen={isEditDialogOpen}
              onClose={() => {
                setIsEditDialogOpen(false)
                setEditingArticle(null)
              }}
              onSave={handleSaveEdit}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
