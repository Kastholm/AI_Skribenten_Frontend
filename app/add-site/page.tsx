"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import ProtectedRoute from "@/app/components/protected-route"
import AdminRoute from "@/app/components/admin-route"
import { API_HOST } from "@/app/env"

export default function AddSitePage() {
  const [formData, setFormData] = useState({
    name: "",
    page_url: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${API_HOST}/sites/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage("Site created successfully!")
        setFormData({ name: "", page_url: "", description: "" })
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.detail || "Failed to create site"}`)
      }
    } catch (error) {
      setMessage("Error: Failed to create site")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <AdminRoute>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <div className="mx-auto w-full max-w-md">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Site</CardTitle>
                    <CardDescription>Create a new site for content management</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Site Name</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="page_url">Page URL</Label>
                        <Input
                          id="page_url"
                          type="url"
                          value={formData.page_url}
                          onChange={(e) => setFormData({ ...formData, page_url: e.target.value })}
                          placeholder="https://example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Brief description of the site"
                          required
                        />
                      </div>
                      {message && (
                        <div className={`text-sm ${message.includes("Error") ? "text-red-500" : "text-green-500"}`}>
                          {message}
                        </div>
                      )}
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating..." : "Create Site"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AdminRoute>
    </ProtectedRoute>
  )
}
