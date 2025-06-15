"use client"

import type React from "react"

import { useState, useEffect } from "react"
import ProtectedRoute from "../components/protected-route"
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
import { useAuth } from "../context/auth-context"
import { API_HOST } from "../env"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Plus, Loader2, Edit, Trash2, Save, X, MessageSquare } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

type Prompt = {
  id: number
  name: string
  description: string
  user_id: number
  created_at?: string
}

export default function PromptsPage() {
  const { user } = useAuth()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Create prompt dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
  })

  // Edit state
  const [editingPromptId, setEditingPromptId] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
  })
  const [isSaving, setIsSaving] = useState<number | null>(null)

  // Delete state
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch prompts when component mounts or user changes
  const fetchPrompts = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_HOST}/prompts/all/${user.id}`, {
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
      } else {
        console.error("Failed to fetch prompts")
        setError("Failed to load prompts. Please try again later.")
      }
    } catch (error) {
      console.error("Error fetching prompts:", error)
      setError("An error occurred while loading prompts.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [user?.id])

  // Handle create form changes
  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCreateFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle create submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    if (!user?.id) {
      setError("You must be logged in to create prompts.")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(`${API_HOST}/prompts/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: createFormData.name,
          description: createFormData.description,
          user_id: user.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Prompt created successfully!")
        setCreateFormData({
          name: "",
          description: "",
        })
        setIsCreateDialogOpen(false)
        fetchPrompts() // Refresh prompts list
      } else {
        setError(data.error || "Failed to create prompt")
      }
    } catch (error) {
      console.error("Error creating prompt:", error)
      setError("An error occurred while creating the prompt.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit start
  const handleEditStart = (prompt: Prompt) => {
    setEditingPromptId(prompt.id)
    setEditFormData({
      name: prompt.name,
      description: prompt.description,
    })
  }

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingPromptId(null)
    setEditFormData({
      name: "",
      description: "",
    })
  }

  // Handle edit form changes
  const handleEditChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle edit save
  const handleEditSave = async (promptId: number) => {
    if (!user?.id) return

    setIsSaving(promptId)
    setError("")

    try {
      const response = await fetch(`${API_HOST}/prompts/update/${promptId}/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editFormData.name,
          description: editFormData.description,
        }),
      })

      if (response.ok) {
        setSuccess("Prompt updated successfully!")
        setEditingPromptId(null)
        fetchPrompts() // Refresh prompts list
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to update prompt" }))
        setError(errorData.error || "Failed to update prompt")
      }
    } catch (error) {
      console.error("Error updating prompt:", error)
      setError("An error occurred while updating the prompt.")
    } finally {
      setIsSaving(null)
    }
  }

  // Handle delete start
  const handleDeleteStart = (prompt: Prompt) => {
    setDeletingPrompt(prompt)
    setIsDeleteDialogOpen(true)
  }

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deletingPrompt || !user?.id) return

    setIsDeleting(true)

    try {
      const response = await fetch(`${API_HOST}/prompts/delete/${deletingPrompt.id}/${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setSuccess("Prompt deleted successfully!")
        setIsDeleteDialogOpen(false)
        setDeletingPrompt(null)
        fetchPrompts() // Refresh prompts list
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete prompt" }))
        setError(errorData.error || "Failed to delete prompt")
      }
    } catch (error) {
      console.error("Error deleting prompt:", error)
      setError("An error occurred while deleting the prompt.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Format date string to a more readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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
                    <BreadcrumbPage>Prompts</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Your Prompts</h1>
                <p className="text-muted-foreground">Create and manage your AI prompts</p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Prompt
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Prompt</DialogTitle>
                    <DialogDescription>Create a new prompt for your AI assistant</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="create-name">Prompt Name</Label>
                        <Input
                          id="create-name"
                          name="name"
                          placeholder="Enter a name for your prompt"
                          value={createFormData.name}
                          onChange={handleCreateChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-description">Prompt Content</Label>
                        <Textarea
                          id="create-description"
                          name="description"
                          placeholder="Enter your prompt content here..."
                          value={createFormData.description}
                          onChange={handleCreateChange}
                          rows={5}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Prompt"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Prompts Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading prompts...</span>
              </div>
            ) : prompts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No prompts yet</h3>
                <p className="text-muted-foreground mb-4">Create your first prompt to get started</p>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Prompt
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prompts.map((prompt) => (
                  <Card key={prompt.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        {editingPromptId === prompt.id ? (
                          <Input
                            value={editFormData.name}
                            onChange={(e) => handleEditChange("name", e.target.value)}
                            className="font-semibold"
                            placeholder="Prompt name"
                          />
                        ) : (
                          <CardTitle className="text-lg leading-tight">{prompt.name}</CardTitle>
                        )}
                        <div className="flex items-center gap-1 ml-2">
                          {editingPromptId === prompt.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSave(prompt.id)}
                                disabled={isSaving === prompt.id}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                                title="Save changes"
                              >
                                {isSaving === prompt.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleEditCancel}
                                disabled={isSaving === prompt.id}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                title="Cancel editing"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStart(prompt)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                title="Edit prompt"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStart(prompt)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                title="Delete prompt"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-xs">Created: {formatDate(prompt.created_at)}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {editingPromptId === prompt.id ? (
                        <Textarea
                          value={editFormData.description}
                          onChange={(e) => handleEditChange("description", e.target.value)}
                          rows={6}
                          className="resize-none"
                          placeholder="Prompt content"
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{prompt.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the prompt "{deletingPrompt?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}
