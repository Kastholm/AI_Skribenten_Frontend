"use client"

import type React from "react"

import { useState } from "react"
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

export default function AddSitePage() {
  const [formData, setFormData] = useState({
    name: "",
    logourl: "",
    description: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const response = await fetch(`${API_HOST}/sites/add_site`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Site added successfully!")
        setFormData({
          name: "",
          logourl: "",
          description: "",
        })
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
                      <Label htmlFor="logourl">Logo URL</Label>
                      <Input
                        id="logourl"
                        name="logourl"
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={formData.logourl}
                        onChange={handleChange}
                        required
                      />
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
