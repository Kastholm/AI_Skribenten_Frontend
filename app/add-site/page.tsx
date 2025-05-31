"use client"

import type React from "react"

import { useState, useRef } from "react"
import AdminRoute from "../components/admin-route"
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
import { API_HOST } from "../env"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AddSitePage() {
  const [formData, setFormData] = useState({
    name: "",
    pageurl: "",
    description: "",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!logoFile) {
      setError("Please select a logo file")
      setIsLoading(false)
      return
    }

    try {
      // Create a FormData object to send the file and other form data
      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("pageurl", formData.pageurl)
      formDataToSend.append("logo", logoFile)

      const response = await fetch(`${API_HOST}/sites/add_site`, {
        method: "POST",
        body: formDataToSend, // No Content-Type header needed, browser sets it with boundary
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Site added successfully!")
        setFormData({
          name: "",
          pageurl: "",
          description: "",
        })
        setLogoFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        setError(data.error || "Failed to add site")
      }
    } catch (error) {
      console.error("Site creation error:", error)
      setError("Network error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminRoute>
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
                    <BreadcrumbPage>Add Site</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="mx-auto w-full max-w-md">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Site</CardTitle>
                  <CardDescription>Create a new site entry</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Site Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter site name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pageurl">Page URL</Label>
                      <Input
                        id="pageurl"
                        name="pageurl"
                        type="url"
                        placeholder="https://example.com"
                        value={formData.pageurl}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo">Logo</Label>
                      <Input
                        id="logo"
                        name="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        required
                      />
                      <p className="text-xs text-muted-foreground">Upload a logo image for the site</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Enter site description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        required
                      />
                      <Alert variant="warning" className="bg-amber-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          The description is important as it will be used in AI prompts for this site.
                        </AlertDescription>
                      </Alert>
                    </div>
                    {error && <p className="text-sm font-medium text-red-500">{error}</p>}
                    {success && <p className="text-sm font-medium text-green-500">{success}</p>}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Adding Site..." : "Add Site"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminRoute>
  )
}
