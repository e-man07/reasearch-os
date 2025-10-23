'use client'

import { ExternalLink, Calendar, Users, FileText, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface Paper {
  id: string
  title: string
  authors: Array<{ name: string }>
  abstract?: string
  year?: number
  venue?: string
  citationCount?: number
  url?: string
  source: string
}

interface PaperCardProps {
  paper: Paper
  onSelect?: (paper: Paper) => void
}

export function PaperCard({ paper, onSelect }: PaperCardProps) {
  const authorNames = paper.authors.slice(0, 3).map((a) => a.name).join(', ')
  const hasMoreAuthors = paper.authors.length > 3

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base leading-tight flex-1">
            {paper.title}
          </CardTitle>
          {paper.url && (
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Open paper"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Authors */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>
            {authorNames}
            {hasMoreAuthors && ` +${paper.authors.length - 3} more`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {paper.year && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{paper.year}</span>
            </div>
          )}

          {paper.venue && (
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span className="truncate max-w-xs">{paper.venue}</span>
            </div>
          )}

          {paper.citationCount !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>{paper.citationCount} citations</span>
            </div>
          )}

          <Badge variant="secondary">{paper.source}</Badge>
        </div>

        {/* Abstract */}
        {paper.abstract && (
          <CardDescription className="line-clamp-3 text-sm">
            {paper.abstract}
          </CardDescription>
        )}

        {/* Actions */}
        {onSelect && (
          <Button
            onClick={() => onSelect(paper)}
            variant="ghost"
            size="sm"
            className="h-8"
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
