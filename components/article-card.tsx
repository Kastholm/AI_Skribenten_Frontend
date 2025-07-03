"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Calendar } from "lucide-react"

interface Article {
  id: number
  title: string
  teaser: string
  url: string
  status: string
  created_at: string
}

interface ArticleCardProps {
  article: Article
  onEdit?: (article: Article) => void
  onDelete?: (articleId: number) => void
  onPublish?: (articleId: number) => void
  showPublishButton?: boolean
  isPublishing?: boolean
}

export function ArticleCard({
  article,
  onEdit,
  onDelete,
  onPublish,
  showPublishButton = false,
  isPublishing = false,
}: ArticleCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Article Image */}
      <div className="aspect-video overflow-hidden bg-muted">
        <img
          src={`/placeholder.svg?height=200&width=300&query=${encodeURIComponent(article.title)}`}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Hover Overlay with Actions */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ${
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute top-4 right-4 flex gap-2">
          {showPublishButton && onPublish && (
            <Button
              size="sm"
              className="h-7 w-auto px-3 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onPublish(article.id)}
              disabled={isPublishing}
            >
              {isPublishing ? "Publishing..." : "Publicer"}
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(article)}>
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={() => onDelete(article.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-base line-clamp-2 leading-tight">{article.title}</h3>

        {/* Teaser */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{article.teaser}</p>

        {/* Separator */}
        <div className="border-t pt-3">
          {/* Meta Information */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(article.created_at).toLocaleDateString()}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {article.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
