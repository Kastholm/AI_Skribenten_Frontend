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
    page_url: "", // Changed from pageurl to page_url
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

  // Function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (typeof reader.result === "string") {
          // Remove the data:image/...;base64, prefix and return just the base64
          const base64 = reader.result.split(",")[1]
          resolve(base64)
        } else {
          reject(new Error("Failed to convert file to base64"))
        }
      }
      reader.onerror = (error) => reject(error)
    })
  }

  // Function to validate domain format
  const isValidDomain = (domain: string): boolean => {
    // Remove protocol and www if present
    let cleanDomain = domain.toLowerCase()
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "")
    cleanDomain = cleanDomain.replace(/^www\./, "")

    // Check if it matches domain pattern (name.tld)
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/
    return domainPattern.test(cleanDomain)
  }

  // Function to format API error messages
  const formatErrorMessage = (errorData: any): string => {
    if (typeof errorData === "string") {
      return errorData
    }

    if (errorData?.detail) {
      if (Array.isArray(errorData.detail)) {
        // Handle FastAPI validation errors
        return errorData.detail
          .map((err: any) => {
            if (typeof err === "string") return err
            if (err.msg) return `${err.loc?.join(" → ") || "Field"}: ${err.msg}`
            return JSON.stringify(err)
          })
          .join(", ")
      }
      if (typeof errorData.detail === "string") {
        return errorData.detail
      }
    }

    if (errorData?.error) {
      return typeof errorData.error === "string" ? errorData.error : JSON.stringify(errorData.error)
    }

    return "An unknown error occurred"
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

    // Validate domain format
    if (!isValidDomain(formData.page_url)) {
      // Changed from pageurl to page_url
      setError("Please enter a valid domain (e.g., example.com, site.dk)")
      setIsLoading(false)
      return
    }

    try {
      // Convert file to base64
      const logoBase64 = await fileToBase64(logoFile)

      const requestData = {
        name: formData.name,
        description: formData.description,
        page_url: formData.page_url, // Changed from pageurl to page_url
        logo: logoBase64, // Send as base64 string
      }

      console.log("Sending request data:", {
        ...requestData,
        logo: `[base64 string of ${logoBase64.length} characters]`, // Don't log the actual base64
      })

      const response = await fetch(`${API_HOST}/sites/add_site`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError)
        setError("Invalid response from server")
        setIsLoading(false)
        return
      }

      console.log("Response data:", data)

      if (response.ok) {
        setSuccess("Site added successfully!")
        setFormData({
          name: "",
          page_url: "", // Changed from pageurl to page_url
          description: "",
        })
        setLogoFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        const errorMessage = formatErrorMessage(data)
        setError(errorMessage)
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
                      <Label htmlFor="page_url">Domain</Label> {/* Changed from pageurl to page_url */}
                      <Input
                        id="page_url" // Changed from pageurl to page_url
                        name="page_url" // Changed from pageurl to page_url
                        placeholder="example.com"
                        value={formData.page_url} // Changed from pageurl to page_url
                        onChange={handleChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter domain without protocol (e.g., example.com, site.dk, domain.de)
                      </p>
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
                      <Alert className="bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          Beskrivelsen er vigtig da den indgår i AI prompten til siden.
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
