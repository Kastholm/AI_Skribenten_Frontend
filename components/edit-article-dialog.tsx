"use client"

import type React from "react"

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
  created_at: string
  prompt_instruction?: string
  response?: string
}

type EditArticleDialogProps = {
  article: Article | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditArticleDialog({ article, isOpen, onClose, onSave }: EditArticleDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    content: "",
    img: "",
    prompt_instruction: "",
    scheduled_publish_at: "",
    category_id: 1,
    user_id: 1,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
        if (Array.isArray(articleData) && articleData.length > 0) {
          // Map article data from array format
          const data = articleData[0] // Assuming single article returned as array
          setFormData({
            title: data[1] || "",
            url: data[5] || "",
            content: data[3] || "",
            img: data[4] || "",
            prompt_instruction: data[12] || "", // Assuming prompt_instruction is at index 12
            scheduled_publish_at: data[9] ? new Date(data[9]).toISOString().slice(0, 16) : "",
            category_id: data[8] || 1,
            user_id: data[7] || 1,
          })

          // Set image preview if image exists
          if (data[4]) {
            setImagePreview(data[4])
          }
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64 = reader.result.split(",")[1]
          resolve(base64)
        } else {
          reject(new Error("Failed to convert file to base64"))
        }
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")

    try {
      let imageData = formData.img

      // If new image file is selected, convert to base64
      if (imageFile) {
        imageData = await fileToBase64(imageFile)
      }

      const updateData = {
        id: article?.id,
        title: formData.title,
        url: formData.url,
        content: formData.content,
        img: imageData,
        prompt_instruction: formData.prompt_instruction,
        scheduled_publish_at: formData.scheduled_publish_at || null,
        category_id: formData.category_id,
        user_id: formData.user_id,
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
      title: "",
      url: "",
      content: "",
      img: "",
      prompt_instruction: "",
      scheduled_publish_at: "",
      category_id: 1,
      user_id: 1,
    })
    setImageFile(null)
    setImagePreview(null)
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
              <Label htmlFor="image">Billede</Label>
              <div className="space-y-2">
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview.startsWith("data:") ? imagePreview : `data:image/jpeg;base64,${imagePreview}`}
                      alt="Preview"
                      className="max-w-xs max-h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
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
