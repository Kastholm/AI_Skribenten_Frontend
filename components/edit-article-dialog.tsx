"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { API_HOST } from "@/app/env"

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
  response: string
  prompt_instruction: string
  created_at: string
}

type EditArticleDialogProps = {
  article: Article | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditArticleDialog({ article, isOpen, onClose, onSave }: EditArticleDialogProps) {
  const [formData, setFormData] = useState({
    id: 0,
    title: "",
    teaser: "",
    url: "",
    content: "",
    img: "",
    prompt_instruction: "",
    scheduled_publish_at: "",
    category_id: 1,
    user_id: 1,
    site_id: 1,
    status: "",
    response: "success",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Load article data when dialog opens
  useEffect(() => {
    if (article && isOpen) {
      fetchArticleDetails(article.id)
    }
  }, [article, isOpen])

  const fetchArticleDetails = async (articleId: number) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_HOST}/articles/get_article/${articleId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const articleData = await response.json()
        console.log("Article data:", articleData)

        if (Array.isArray(articleData) && articleData.length > 0) {
          // Map article data from array format
          // Based on the table structure:
          // id, site_id, title, teaser, content, img, status, response, scheduled_publish_at, published_at, url, category_id, user_id, prompt_instruction, created_at, updated_at
          const data = articleData
          setFormData({
            id: data[0] || 0,
            title: data[2] || "",
            teaser: data[3] || "",
            content: data[4] || "",
            img: data[5] || "",
            url: data[10] || "",
            site_id: data[1] || 1,
            user_id: data[12] || 1,
            category_id: data[11] || 1,
            status: data[6] || "",
            response: data[7] || "success",
            prompt_instruction: data[13] || "",
            scheduled_publish_at: data[8] ? new Date(data[8]).toISOString().slice(0, 16) : "",
          })
        }
      } else {
        setError("Failed to load article details")
      }
    } catch (error) {
      console.error("Error fetching article details:", error)
      setError("An error occurred while loading article details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")

    try {
      const updateData = {
        id: article?.id,
        title: formData.title,
        teaser: formData.teaser,
        url: formData.url,
        content: formData.content,
        img: formData.img,
        prompt_instruction: formData.prompt_instruction,
        scheduled_publish_at: formData.scheduled_publish_at || null,
        category_id: formData.category_id,
        user_id: formData.user_id,
        site_id: formData.site_id,
        status: formData.status,
        response: formData.response,
      }

      const response = await fetch(`${API_HOST}/articles/update_article`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        onSave()
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to update article" }))
        setError(errorData.error || "Failed to update article")
      }
    } catch (error) {
      console.error("Error updating article:", error)
      setError("An error occurred while updating the article")
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setFormData({
      id: 0,
      title: "",
      teaser: "",
      url: "",
      content: "",
      img: "",
      prompt_instruction: "",
      scheduled_publish_at: "",
      category_id: 1,
      user_id: 1,
      site_id: 1,
      status: "",
      response: "success",
    })
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger Artikel</DialogTitle>
          <DialogDescription>Rediger artikel information og gem ændringerne.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Indlæser artikel...</span>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input id="title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL (ikke redigerbar)</Label>
                <Input id="url" value={formData.url} disabled className="bg-muted" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teaser">Teaser</Label>
              <Textarea
                id="teaser"
                value={formData.teaser}
                onChange={(e) => handleInputChange("teaser", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Indhold</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt Instruktion</Label>
              <Textarea
                id="prompt"
                value={formData.prompt_instruction}
                onChange={(e) => handleInputChange("prompt_instruction", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled">Planlagt Udgivelse</Label>
                <Input
                  id="scheduled"
                  type="datetime-local"
                  value={formData.scheduled_publish_at}
                  onChange={(e) => handleInputChange("scheduled_publish_at", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori ID</Label>
                <Input
                  id="category"
                  type="number"
                  value={formData.category_id}
                  onChange={(e) => handleInputChange("category_id", Number.parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user">Bruger ID</Label>
                <Input
                  id="user"
                  type="number"
                  value={formData.user_id}
                  onChange={(e) => handleInputChange("user_id", Number.parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Billede URL</Label>
              <Input
                id="image"
                type="text"
                placeholder="Indtast billede URL"
                value={formData.img}
                onChange={(e) => handleInputChange("img", e.target.value)}
              />
              {formData.img && (
                <div className="mt-2">
                  <img
                    src={formData.img || "/placeholder.svg"}
                    alt="Preview"
                    className="max-w-xs max-h-32 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=100&width=200"
                      e.currentTarget.alt = "Billede ikke tilgængeligt"
                    }}
                  />
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuller
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gemmer...
              </>
            ) : (
              "Gem Ændringer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
