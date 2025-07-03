"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit } from "lucide-react"
import { EditArticleDialog } from "@/components/edit-article-dialog"
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

export default function ArkivPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    const fetchArchivedArticles = async () => {
      try {
        const response = await fetch(`${API_HOST}/articles/archived`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setArticles(data.articles || [])
        } else {
          console.error("Failed to fetch archived articles")
        }
      } catch (error) {
        console.error("Error fetching archived articles:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchArchivedArticles()
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

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div>
              <h1 className="text-3xl font-bold">Arkiv</h1>
              <p className="text-muted-foreground">Arkiverede artikler og tidligere indhold</p>
            </div>

            {loading ? (
              <div>Loading archived articles...</div>
            ) : articles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Ingen arkiverede artikler</div>
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
