"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  Clock,
  CheckCircle,
  ExternalLink,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
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

interface ArticleCardProps {
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

  // Format date string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Ikke planlagt"

    const date = new Date(dateString)
    if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
      return "Ugyldig dato"
    }

    return date.toLocaleDateString("da-DK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg h-[400px] flex flex-col">
      {/* Hover Overlay with Status and Actions */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex flex-col">
        {/* Status Badge at Top */}
        <div className="p-4 flex justify-between items-start">
          <Badge variant="secondary" className="bg-white/90 text-black">
            <div className="flex items-center gap-1">
              {getStatusIcon(article.status)}
              <span className="capitalize">{article.status}</span>
            </div>
          </Badge>
        </div>

        {/* Action Buttons at Bottom */}
        <div className="mt-auto p-4 space-y-2">
          {/* Publish Button */}
          {showPublishButton && onPublish && (
            <Button
              onClick={() => onPublish(article)}
              disabled={isPublishing}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-8"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Publicerer...
                </>
              ) : (
                "Publicer"
              )}
            </Button>
          )}

          {/* Action Buttons Row */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDelete(article)}
              className="flex-1 h-7 text-red-600 hover:text-red-800 hover:bg-red-50"
              title="Slet artikel"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(article)}
              className="flex-1 h-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              title="Rediger artikel"
            >
              <Edit className="h-3 w-3" />
            </Button>
            {article.url && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenUrl(article.url)}
                className="flex-1 h-7 text-green-600 hover:text-green-800 hover:bg-green-50"
                title="Åbn artikel URL"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="relative overflow-hidden h-48">
        <img
          src={article.img || "/placeholder.svg?height=200&width=400&query=article"}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-medium text-base mb-2 line-clamp-2 leading-tight">{article.title}</h3>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-4 flex-1">{article.teaser}</p>

        <div className="border-t pt-3 mt-auto">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{getUserName(article.user_id)}</span>
            <span>{formatDate(article.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
