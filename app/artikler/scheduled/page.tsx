"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit } from "lucide-react"
import { EditArticleDialog } from "@/components/edit-article-dialog"
import { ArticleCard } from "@/components/article-card"
import { ViewToggle } from "@/components/view-toggle"
import ProtectedRoute from "@/app/components/protected-route"
import { API_HOST } from "@/app/env"

interface Article {
  id: number
  title: string
  teaser: string
  url: string
  status: string
  created_at: string
}

export default function ScheduledPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [view, setView] = useState<"table" | "card">("table")
  const [publishingId, setPublishingId] = useState<number | null>(null)

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

  const handlePublish = async (articleId: number) => {
    setPublishingId(articleId)
    try {
      const response = await fetch(`${API_HOST}/articles/write_article`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          article_id: articleId,
        }),
      })

      if (response.ok) {
        // Remove from scheduled list or update status
        setArticles(articles.filter((article) => article.id !== articleId))
      } else {
        console.error("Failed to publish article")
      }
    } catch (error) {
      console.error("Error publishing article:", error)
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Scheduled</h1>
                <p className="text-muted-foreground">Articles scheduled for publication</p>
              </div>
              <ViewToggle view={view} onViewChange={setView} />
            </div>

            {loading ? (
              <div>Loading scheduled articles...</div>
            ) : articles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No scheduled articles</div>
            ) : view === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPublish={handlePublish}
                    showPublishButton={true}
                    isPublishing={publishingId === article.id}
                  />
                ))}
              </div>
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
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handlePublish(article.id)}
                        disabled={publishingId === article.id}
                      >
                        {publishingId === article.id ? "Publishing..." : "Publicer"}
                      </Button>
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
            )}

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
