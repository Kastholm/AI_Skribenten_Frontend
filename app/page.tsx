"use client"

import { useState, useEffect } from "react"
import ProtectedRoute from "./components/protected-route"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useAuth } from "./context/auth-context"
import { API_HOST } from "./env"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HomePage() {
  const { user } = useAuth()
  const [userSites, setUserSites] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserSites = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_HOST}/users/sites/${user.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.sites && Array.isArray(data.sites)) {
            setUserSites(data.sites)
          }
        }
      } catch (error) {
        console.error("Error fetching user sites:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserSites()
  }, [user?.id])

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : userSites.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <Card className="w-full max-w-md">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      No Sites Assigned
                    </CardTitle>
                    <CardDescription>You are not connected to any sites yet.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please contact your administrator to get access to sites. Once you have been assigned to sites,
                        they will appear in the sidebar and you can start working with them.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                  <div className="aspect-video rounded-xl bg-muted/50" />
                  <div className="aspect-video rounded-xl bg-muted/50" />
                  <div className="aspect-video rounded-xl bg-muted/50" />
                </div>
                <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
              </>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
