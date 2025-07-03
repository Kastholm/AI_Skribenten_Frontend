"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import ProtectedRoute from "@/app/components/protected-route"
import AdminRoute from "@/app/components/admin-route"
import { API_HOST } from "@/app/env"

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "user",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch(`${API_HOST}/users/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage("User created successfully!")
        setFormData({ username: "", password: "", name: "", role: "user" })
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.detail || "Failed to create user"}`)
      }
    } catch (error) {
      setMessage("Error: Failed to create user")
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
                    <CardTitle>Add New User</CardTitle>
                    <CardDescription>Create a new user account for the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {message && (
                        <div className={`text-sm ${message.includes("Error") ? "text-red-500" : "text-green-500"}`}>
                          {message}
                        </div>
                      )}
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating..." : "Create User"}
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
