"use client"

import type React from "react"

import { useState, useEffect } from "react"
import ProtectedRoute from "../../components/protected-route"
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
import { useAuth } from "../../context/auth-context"
import { API_HOST } from "../../env"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Globe, Loader2, Save, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Site = {
  id: number
  name: string
  logo: string
  description: string
  page_url: string
}

export default function PageSettingsPage() {
  const { user } = useAuth()
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null)
  const [activeSite, setActiveSite] = useState<Site | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    description: "",
    page_url: "",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Fetch site data
  const fetchSiteData = async (siteId: number) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_HOST}/sites/get_site_by_id/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const siteData = await response.json()
        console.log("Site data:", siteData)

        if (Array.isArray(siteData) && siteData.length >= 5) {
          // Backend returns: [id, name, logo, description, page_url]
          const site: Site = {
            id: siteData[0],
            name: siteData[1],
            logo: siteData[2],
            description: siteData[3],
            page_url: siteData[4],
          }

          setActiveSite(site)
          setFormData({
            name: site.name,
            logo: site.logo,
            description: site.description,
            page_url: site.page_url,
          })
        } else {
          setError("Uventet site data format")
        }
      } else {
        setError("Kunne ikke hente site data")
      }
    } catch (error) {
      console.error("Error fetching site data:", error)
      setError("Fejl ved hentning af site data")
    } finally {
      setIsLoading(false)
    }
  }

  // Get active site ID from user's sites
  useEffect(() => {
    const fetchUserSites = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`${API_HOST}/users/sites/${user.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.sites && Array.isArray(data.sites) && data.sites.length > 0) {
            // Use the first site for now
            const firstSiteId = data.sites[0][0] // First site's ID
            setActiveSiteId(firstSiteId)
            fetchSiteData(firstSiteId)
          } else {
            setIsLoading(false)
            setError("Ingen sites fundet for denne bruger")
          }
        }
      } catch (error) {
        console.error("Error fetching user sites:", error)
        setIsLoading(false)
        setError("Fejl ved hentning af bruger sites")
      }
    }

    fetchUserSites()
  }, [user?.id])

  // Listen for site changes from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const storedActiveSite = localStorage.getItem("activeSite")
      if (storedActiveSite) {
        try {
          const siteData = JSON.parse(storedActiveSite)
          if (siteData.id !== activeSiteId) {
            setActiveSiteId(siteData.id)
            fetchSiteData(siteData.id)
          }
        } catch (error) {
          console.error("Error parsing stored active site:", error)
        }
      }
    }

    // Listen for storage changes
    window.addEventListener("storage", handleStorageChange)
    // Also listen for custom events (for same-tab changes)
    window.addEventListener("activeSiteChanged", handleStorageChange)
    // Check for stored active site on mount
    handleStorageChange()

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("activeSiteChanged", handleStorageChange)
    }
  }, [activeSiteId])

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle file change
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSaving(true)

    if (!activeSiteId) {
      setError("Intet aktivt site fundet")
      setIsSaving(false)
      return
    }

    try {
      let logoBase64 = formData.logo

      // If a new logo file is selected, convert it to base64
      if (logoFile) {
        logoBase64 = await fileToBase64(logoFile)
      }

      const updateData = {
        name: formData.name,
        logo: logoBase64,
        description: formData.description,
        page_url: formData.page_url,
      }

      console.log("Updating site with data:", {
        ...updateData,
        logo: `[base64 string of ${logoBase64.length} characters]`, // Don't log the actual base64
      })

      const response = await fetch(`${API_HOST}/sites/update_site/${activeSiteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        setSuccess("Site opdateret succesfuldt!")
        setLogoFile(null) // Clear the file input
        // Refresh site data
        fetchSiteData(activeSiteId)
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to update site" }))
        setError(errorData.error || "Kunne ikke opdatere site")
      }
    } catch (error) {
      console.error("Error updating site:", error)
      setError("Fejl ved opdatering af site")
    } finally {
      setIsSaving(false)
    }
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
                    <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Page Settings {activeSite && `- ${activeSite.name}`}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Indlæser site indstillinger...</span>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Page Settings
                      {activeSite && (
                        <span className="text-sm font-normal text-muted-foreground">for {activeSite.name}</span>
                      )}
                    </CardTitle>
                    <CardDescription>Administrer indstillinger for {activeSite?.name || "dit site"}</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Site Navn</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Indtast site navn"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="page_url">Domain</Label>
                        <Input
                          id="page_url"
                          value={formData.page_url}
                          onChange={(e) => handleInputChange("page_url", e.target.value)}
                          placeholder="example.com"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Indtast domain uden protokol (f.eks. example.com, site.dk)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="logo">Logo</Label>
                        <Input id="logo" type="file" accept="image/*" onChange={handleFileChange} />
                        <p className="text-xs text-muted-foreground">
                          Upload et nyt logo billede (valgfrit - lad være tom for at beholde nuværende logo)
                        </p>
                        {formData.logo && !logoFile && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground mb-2">Nuværende logo:</p>
                            <img
                              src={`data:image/jpeg;base64,${formData.logo}`}
                              alt="Current logo"
                              className="max-w-xs max-h-32 object-contain rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="description">Beskrivelse</Label>
                          <Info className="h-4 w-4 text-blue-500" />
                        </div>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          placeholder="Indtast site beskrivelse"
                          rows={4}
                          required
                        />
                        <Alert className="bg-amber-50 border-amber-200">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800">
                            Beskrivelsen er vigtig da den indgår i AI prompten til siden og bruges til at generere
                            artikler.
                          </AlertDescription>
                        </Alert>
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

                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Gemmer...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Gem Ændringer
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </form>
                </Card>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
