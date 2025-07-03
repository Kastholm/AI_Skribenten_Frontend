"use client"

import type React from "react"
import { useState, useEffect } from "react"
import ProtectedRoute from "@/app/components/protected-route"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, Save, Info, ChevronDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const API_HOST = "https://your-api-host.com" // Declare API_HOST here

type Site = {
  id: number
  name: string
  logo: string | null
  description: string
  page_url: string
}

type UserSite = {
  id: number
  name: string
  description: string
  page_url: string
}

export default function SettingsPage() {
  const [userSites, setUserSites] = useState<UserSite[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string>("")
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [isLoadingSites, setIsLoadingSites] = useState(true)
  const [isLoadingSiteData, setIsLoadingSiteData] = useState(false)
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
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)

  // Fetch user sites
  const fetchUserSites = async () => {
    setIsLoadingSites(true)
    setError("")

    try {
      console.log("Fetching user sites")
      const response = await fetch(`${API_HOST}/users/sites`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("User sites response:", data)

        if (data.sites && Array.isArray(data.sites)) {
          const formattedSites: UserSite[] = data.sites.map((siteArray: any[]) => ({
            id: siteArray[0],
            name: siteArray[1],
            description: siteArray[2],
            page_url: siteArray[3],
          }))

          console.log("Formatted user sites:", formattedSites)
          setUserSites(formattedSites)
        } else {
          setError("Ingen sites fundet")
        }
      } else {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        setError(`Kunne ikke hente sites: ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching user sites:", error)
      setError("Fejl ved hentning af sites")
    } finally {
      setIsLoadingSites(false)
    }
  }

  // Fetch detailed site data
  const fetchSiteData = async (siteId: number) => {
    setIsLoadingSiteData(true)
    setError("")

    try {
      console.log("Fetching detailed site data for site ID:", siteId)
      const response = await fetch(`${API_HOST}/sites/get_site_by_id/${siteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const siteData = await response.json()
        console.log("Raw site data from API:", siteData)

        if (Array.isArray(siteData) && siteData.length >= 5) {
          // Backend returns: [id, name, logo, description, page_url]
          const site: Site = {
            id: siteData[0],
            name: siteData[1] || "",
            logo: siteData[2], // This should now be base64 string from backend
            description: siteData[3] || "",
            page_url: siteData[4] || "",
          }

          console.log("Formatted site object:", {
            ...site,
            logo: site.logo ? `[Logo data present - ${typeof site.logo}]` : "No logo",
          })

          setSelectedSite(site)
          setFormData({
            name: site.name,
            logo: site.logo || "",
            description: site.description,
            page_url: site.page_url,
          })
        } else {
          console.error("Unexpected site data format:", siteData)
          setError("Uventet site data format")
        }
      } else {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        setError(`Kunne ikke hente site data: ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching site data:", error)
      setError("Fejl ved hentning af site data")
    } finally {
      setIsLoadingSiteData(false)
    }
  }

  // Handle site selection
  const handleSiteSelect = (siteId: string) => {
    setSelectedSiteId(siteId)
    setSelectedSite(null)
    setFormData({
      name: "",
      logo: "",
      description: "",
      page_url: "",
    })
    setLogoFile(null)
    if (fileInputRef) {
      fileInputRef.value = ""
    }
    setError("")
    setSuccess("")

    if (siteId) {
      fetchSiteData(Number.parseInt(siteId))
    }
  }

  // Initial load of user sites
  useEffect(() => {
    fetchUserSites()
  }, [])

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

  // Function to convert file to base64 (same as add-site)
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

  // Function to validate domain format (same as add-site)
  const isValidDomain = (domain: string): boolean => {
    // Remove protocol and www if present
    let cleanDomain = domain.toLowerCase()
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "")
    cleanDomain = cleanDomain.replace(/^www\./, "")

    // Check if it matches domain pattern (name.tld)
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/
    return domainPattern.test(cleanDomain)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSaving(true)

    if (!selectedSiteId) {
      setError("Vælg venligst et site først")
      setIsSaving(false)
      return
    }

    // Validate domain format
    if (!isValidDomain(formData.page_url)) {
      setError("Indtast venligst et gyldigt domæne (f.eks. example.com, site.dk)")
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
        logo: logoBase64 ? `[base64 string of ${logoBase64.length} characters]` : "No logo",
      })

      const response = await fetch(`${API_HOST}/sites/update_site/${selectedSiteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        setSuccess("Site opdateret succesfuldt!")
        setLogoFile(null) // Clear the file input
        if (fileInputRef) {
          fileInputRef.value = ""
        }
        // Refresh site data
        fetchSiteData(Number.parseInt(selectedSiteId))
        // Refresh user sites list to show updated name
        fetchUserSites()
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

  // Function to display logo (handle base64 string)
  const getLogoSrc = (logo: string | null) => {
    if (!logo) return null

    // If it's already a data URL, return as is
    if (logo.startsWith("data:")) return logo

    // If it's a base64 string, add the data URL prefix
    if (typeof logo === "string" && logo.length > 0) {
      return `data:image/jpeg;base64,${logo}`
    }

    return null
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="aspect-video rounded-xl bg-muted/50">
                {isLoadingSites ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Indlæser sites...</span>
                  </div>
                ) : userSites.length === 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Ingen sites fundet. Kontakt din administrator for at få adgang til sites.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select value={selectedSiteId} onValueChange={handleSiteSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg et site at administrere">
                        {selectedSiteId && userSites.find((site) => site.id.toString() === selectedSiteId)
                          ? `${userSites.find((site) => site.id.toString() === selectedSiteId)?.name} (${
                              userSites.find((site) => site.id.toString() === selectedSiteId)?.page_url
                            })`
                          : "Vælg et site at administrere"}
                      </SelectValue>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </SelectTrigger>
                    <SelectContent>
                      {userSites.map((site) => (
                        <SelectItem key={site.id} value={site.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{site.name}</span>
                            <span className="text-xs text-muted-foreground">{site.page_url}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="aspect-video rounded-xl bg-muted/50">
                {selectedSiteId && (
                  <>
                    {isLoadingSiteData ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Indlæser site indstillinger...</span>
                      </div>
                    ) : selectedSite ? (
                      <form onSubmit={handleSubmit} className="space-y-6">
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
                          <Input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={setFileInputRef}
                          />
                          <p className="text-xs text-muted-foreground">
                            Upload et nyt logo billede (valgfrit - lad være tom for at beholde nuværende logo)
                          </p>
                          {formData.logo && !logoFile && (
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground mb-2">Nuværende logo:</p>
                              {getLogoSrc(formData.logo) ? (
                                <img
                                  src={getLogoSrc(formData.logo)! || "/placeholder.svg"}
                                  alt="Current logo"
                                  className="max-w-xs max-h-32 object-contain rounded border"
                                  onError={(e) => {
                                    console.error("Failed to load logo image")
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                              ) : (
                                <p className="text-sm text-muted-foreground">Logo data kunne ikke vises</p>
                              )}
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
                      </form>
                    ) : null}
                  </>
                )}
              </div>
              <div className="aspect-video rounded-xl bg-muted/50">
                {/* Additional settings or information can be placed here */}
              </div>
            </div>
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
              {/* Additional settings or information can be placed here */}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
