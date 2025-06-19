"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"

type Article = {
  id: number
  site_id: number
  title: string
  teaser: string
  content: string
  img: string
  status: string
  response: string
  scheduled_publish_at: string | null
  published_at: string | null
  url: string
  prompt_instruction: string
  instructions: string
  user_id: number
  created_at: string
  updated_at: string
}

type ArticleCardProps = {
  article: Article
  onEdit: (article: Article) => void
  onDelete: (article: Article) => void
  onOpenUrl: (url: string) => void
  onPublish?: (article: Article) => void
  getUserName: (userId: number) => string
  isPublishing?: boolean
  showPublishButton?: boolean
}

export function ArticleCard({
  article,
  onEdit,
  onDelete,
  onOpenUrl,
  onPublish,
  getUserName,
  isPublishing = false,
  showPublishButton = false,
}: ArticleCardProps) {
  // Format date string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Ikke angivet"

    const date = new Date(dateString)
    if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
      return "Ugyldig dato"
    }

    return date.toLocaleDateString("da-DK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "validating":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "queued":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "scheduled":
        return <Calendar className="h-4 w-4 text-blue-500" />
      case "published":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
      <CardHeader className="pb-3 relative">
        {/* Status and action buttons - only visible on hover */}
        <div className="absolute inset-x-0 top-0 p-3 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0 z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(article.status)}
              <Badge variant="secondary" className="text-xs">
                {article.status}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(article)}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                title="Slet artikel"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(article)}
                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                title="Rediger artikel"
              >
                <Edit className="h-3 w-3" />
              </Button>
              {article.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenUrl(article.url)}
                  className="h-7 w-7 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                  title="Åbn artikel URL"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              {/* Publish Button - only show on hover if enabled */}
              {showPublishButton && onPublish && (
                <Button
                  onClick={() => onPublish(article)}
                  disabled={isPublishing}
                  className="ml-2 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Udgiver...
                    </>
                  ) : (
                    "Publicer"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pt-0">
        {/* Article Image */}
        <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
          {article.img ? (
            <img
              src={article.img || "/placeholder.svg?height=200&width=300"}
              alt={article.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                e.currentTarget.alt = "Billede ikke tilgængeligt"
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <span className="text-sm">Intet billede</span>
            </div>
          )}
        </div>

        {/* Article Title - smaller */}
        <h3 className="font-semibold text-base leading-tight line-clamp-2" title={article.title}>
          {article.title}
        </h3>

        {/* Article Teaser - more space */}
        {article.teaser && (
          <p className="text-sm text-muted-foreground leading-relaxed flex-1" title={article.teaser}>
            {article.teaser}
          </p>
        )}

        {/* Article Meta */}
        <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center justify-between">
            <span>Oprettet: {formatDate(article.created_at)}</span>
            <span>Af: {getUserName(article.user_id)}</span>
          </div>
          {article.scheduled_publish_at && <div>Planlagt: {formatDate(article.scheduled_publish_at)}</div>}
          {article.published_at && <div>Publiceret: {formatDate(article.published_at)}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
