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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, Copy, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { API_HOST } from "@/app/env"
import { useAuth } from "@/app/context/auth-context"

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
  instructions: string
  created_at: string
}

type Prompt = {
  id: number
  name: string
  description: string
  user_id: number
  created_at: string
}

type Site = {
  id: number
  name: string
  description: string
  page_url: string
}

type User = {
  id: number
  name: string
  username: string
  role: string
}

type Category = {
  id: number
  name: string
  site_id: number
  description?: string
}

type EditArticleDialogProps = {
  article: Article | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditArticleDialog({ article, isOpen, onClose, onSave }: EditArticleDialogProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    id: 0,
    title: "",
    teaser: "",
    url: "",
    content: "",
    img: "",
    prompt_instruction: "",
    instructions: "",
    scheduled_publish_at: "",
    category_id: 1,
    user_id: 1,
    site_id: 1,
    status: "",
    response: "success",
  })
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string>("")
  const [siteInfo, setSiteInfo] = useState<Site | null>(null)
  const [userInfo, setUserInfo] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false)
  const [isLoadingSiteInfo, setIsLoadingSiteInfo] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [error, setError] = useState("")

  // Load article data and related info when dialog opens
  useEffect(() => {
    if (article && isOpen && user?.id) {
      fetchArticleDetails(article.id)
      fetchUserPrompts(user.id)
      fetchAllUsers()
    }
  }, [article, isOpen, user?.id])

  // Fetch site info and categories when site_id changes
  useEffect(() => {
    if (formData.site_id && formData.site_id > 0) {
      fetchSiteInfo(formData.site_id)
      fetchCategories(formData.site_id)
    }
  }, [formData.site_id])

  // Fetch user info when user_id changes
  useEffect(() => {
    if (formData.user_id && formData.user_id > 0 && allUsers.length > 0) {
      const foundUser = allUsers.find((u) => u.id === formData.user_id)
      setUserInfo(foundUser || null)
    }
  }, [formData.user_id, allUsers])

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
          // Korrekt mapping baseret på den opdaterede tabel struktur:
          // id, site_id, title, teaser, content, img, status, response, scheduled_publish_at, published_at, url, prompt_instruction, instructions, user_id, category_id, created_at, updated_at
          const data = articleData
          setFormData({
            id: data[0] || 0, // id
            site_id: data[1] || 1, // site_id
            title: data[2] || "", // title
            teaser: data[3] || "", // teaser
            content: data[4] || "", // content
            img: data[5] || "", // img
            status: data[6] || "", // status
            response: data[7] || "success", // response
            scheduled_publish_at: data[8] ? new Date(data[8]).toISOString().slice(0, 16) : "", // scheduled_publish_at
            // data[9] er published_at - springer over
            url: data[10] || "", // url
            prompt_instruction: data[11] || "", // prompt_instruction
            instructions: data[12] || "", // instructions
            user_id: data[13] || 1, // user_id
            category_id: data[14] || 1, // category_id
            // data[15] er created_at
            // data[16] er updated_at
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

  const fetchSiteInfo = async (siteId: number) => {
    setIsLoadingSiteInfo(true)

    try {
      // Direkte fetch af site data
      const response = await fetch(`${API_HOST}/sites/get_site_by_id/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const siteData = await response.json()
        console.log("Site data:", siteData)

        if (Array.isArray(siteData) && siteData.length >= 3) {
          // Antager at siteData er [id, name, description, page_url]
          const site: Site = {
            id: siteData[0],
            name: siteData[1],
            description: siteData[2],
            page_url: siteData[3],
          }
          setSiteInfo(site)

          // Opdater instructions med site beskrivelsen hvis den er tom
          setFormData((prev) => ({
            ...prev,
            instructions: prev.instructions || site.description || "",
          }))
        }
      } else {
        console.error("Failed to fetch site info, status:", response.status)
      }
    } catch (error) {
      console.error("Error fetching site info:", error)
    } finally {
      setIsLoadingSiteInfo(false)
    }
  }

  const fetchCategories = async (siteId: number) => {
    setIsLoadingCategories(true)

    try {
      const response = await fetch(`${API_HOST}/categories/get_categories/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const categoriesData = await response.json()
        console.log("Categories data:", categoriesData)

        if (Array.isArray(categoriesData)) {
          // Antager at hver kategori er [id, name, site_id, description]
          const formattedCategories: Category[] = categoriesData.map((catArray: any[]) => ({
            id: catArray[0],
            name: catArray[1],
            site_id: catArray[2],
            description: catArray[3],
          }))
          setCategories(formattedCategories)
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setIsLoadingCategories(false)
    }
  }

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
          // Map users data from array format
          // [id, name, username, password, role]
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

  const fetchUserPrompts = async (userId: number) => {
    setIsLoadingPrompts(true)

    try {
      const response = await fetch(`${API_HOST}/prompts/all/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.prompts && Array.isArray(data.prompts)) {
          // Map prompts data from array format to object format
          // Backend returns: [id, name, description, user_id, created_at]
          const formattedPrompts: Prompt[] = data.prompts.map((promptArray: any[]) => ({
            id: promptArray[0],
            name: promptArray[1],
            description: promptArray[2],
            user_id: promptArray[3],
            created_at: promptArray[4],
          }))
          setPrompts(formattedPrompts)
        }
      }
    } catch (error) {
      console.error("Error fetching prompts:", error)
    } finally {
      setIsLoadingPrompts(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePromptSelect = (promptId: string) => {
    setSelectedPromptId(promptId)
    const selectedPrompt = prompts.find((prompt) => prompt.id.toString() === promptId)
    if (selectedPrompt) {
      setFormData((prev) => ({ ...prev, prompt_instruction: selectedPrompt.description }))
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setFormData((prev) => ({ ...prev, category_id: Number.parseInt(categoryId) }))
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
        instructions: formData.instructions,
        scheduled_publish_at: formData.scheduled_publish_at || "", // Send empty string instead of null
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
      id: 0,
      title: "",
      teaser: "",
      url: "",
      content: "",
      img: "",
      prompt_instruction: "",
      instructions: "",
      scheduled_publish_at: "",
      category_id: 1,
      user_id: 1,
      site_id: 1,
      status: "",
      response: "success",
    })
    setPrompts([])
    setSelectedPromptId("")
    setSiteInfo(null)
    setUserInfo(null)
    setAllUsers([])
    setCategories([])
    setError("")
    onClose()
  }

  // Find den aktuelle kategori
  const currentCategory = categories.find((cat) => cat.id === formData.category_id)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
              <div className="flex items-center gap-2">
                <Label htmlFor="instructions">Site Instruktioner</Label>
                <Info className="h-4 w-4 text-blue-500" />
                {isLoadingSiteInfo && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              </div>
              <Textarea
                id="instructions"
                value={formData.instructions || "Ingen instruktioner tilgængelige"}
                onChange={(e) => handleInputChange("instructions", e.target.value)}
                className="bg-blue-50 border-blue-200"
                rows={3}
                placeholder="Site instruktioner"
              />
              {siteInfo && (
                <p className="text-xs text-blue-600">
                  Site: {siteInfo.name} ({siteInfo.page_url}) - Disse instruktioner bruges automatisk i AI prompts.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt">Prompt Instruktion</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="prompt-select" className="text-sm text-muted-foreground">
                    Vælg fra dine prompts:
                  </Label>
                  <Select value={selectedPromptId} onValueChange={handlePromptSelect} disabled={isLoadingPrompts}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={isLoadingPrompts ? "Indlæser..." : "Vælg prompt"} />
                    </SelectTrigger>
                    <SelectContent>
                      {prompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Copy className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{prompt.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea
                id="prompt"
                value={formData.prompt_instruction}
                onChange={(e) => handleInputChange("prompt_instruction", e.target.value)}
                rows={3}
                placeholder="Skriv din prompt instruktion her, eller vælg en eksisterende prompt ovenfor"
              />
              {selectedPromptId && (
                <div className="text-xs text-muted-foreground">
                  Prompt kopieret fra: {prompts.find((p) => p.id.toString() === selectedPromptId)?.name}
                </div>
              )}
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

              {/* Kategori dropdown i stedet for ID input */}
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                {isLoadingCategories ? (
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Indlæser kategorier...</span>
                  </div>
                ) : categories.length > 0 ? (
                  <Select value={formData.category_id.toString()} onValueChange={handleCategorySelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <span className="text-muted-foreground">
                      {currentCategory ? currentCategory.name : `Kategori ID: ${formData.category_id}`}
                    </span>
                  </div>
                )}
                {currentCategory && (
                  <p className="text-xs text-muted-foreground">
                    {currentCategory.description || `Kategori: ${currentCategory.name}`}
                  </p>
                )}
              </div>

              {/* Bruger visning (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="user">Tildelt Bruger</Label>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                  {userInfo ? (
                    <div className="flex flex-col">
                      <span className="font-medium">{userInfo.name}</span>
                      <span className="text-xs text-muted-foreground">
                        @{userInfo.username} ({userInfo.role})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Bruger {formData.user_id}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Artiklen er tildelt til brugeren der startede valideringsprocessen
                </p>
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
