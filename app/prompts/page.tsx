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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Plus, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  // Fetch prompts when component mounts or user changes
  useEffect(() => {
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

    fetchPrompts()
  }, [user?.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
          name: formData.name,
          description: formData.description,
          user_id: user.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Prompt created successfully!")
        setFormData({
          name: "",
          description: "",
        })

        // Refresh prompts list
        const updatedResponse = await fetch(`${API_HOST}/prompts/all/${user.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          if (updatedData.prompts && Array.isArray(updatedData.prompts)) {
            const formattedPrompts: Prompt[] = updatedData.prompts.map((promptArray: any[]) => ({
              id: promptArray[0],
              name: promptArray[1],
              description: promptArray[2],
              user_id: promptArray[3],
              created_at: promptArray[4],
            }))
            setPrompts(formattedPrompts)
          }
        }
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Create Prompt Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New Prompt
                  </CardTitle>
                  <CardDescription>Create a new prompt for your AI assistant</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Prompt Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter a name for your prompt"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Prompt Content</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Enter your prompt content here..."
                        value={formData.description}
                        onChange={handleChange}
                        rows={5}
                        required
                      />
                    </div>
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
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Prompt"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Prompts List */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Your Prompts</CardTitle>
                  <CardDescription>View and manage your saved prompts</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : prompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-muted-foreground">You haven't created any prompts yet.</p>
                      <p className="text-sm text-muted-foreground">
                        Create your first prompt using the form on the left.
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {prompts.map((prompt) => (
                          <Card key={prompt.id} className="overflow-hidden">
                            <CardHeader className="p-4">
                              <CardTitle className="text-lg">{prompt.name}</CardTitle>
                              <CardDescription className="text-xs">
                                Created: {formatDate(prompt.created_at)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-sm whitespace-pre-wrap">{prompt.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
