'use client'

import { useState } from 'react'
import { ExternalLink, Download, Sparkles, CheckCircle } from 'lucide-react'
import { type Paper } from './PaperCard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface PaperDetailModalProps {
  paper: Paper
  onClose: () => void
}

export function PaperDetailModal({ paper, onClose }: PaperDetailModalProps) {
  const [isIndexing, setIsIndexing] = useState(false)
  const [isIndexed, setIsIndexed] = useState(false)
  const [indexError, setIndexError] = useState<string>()

  const handleIndex = async () => {
    setIsIndexing(true)
    setIndexError(undefined)

    try {
      const response = await fetch(`/api/v1/papers/${paper.id}/index`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to index paper')
      }

      const result = await response.json()
      console.log('Indexing result:', result)
      setIsIndexed(true)
    } catch (error) {
      setIndexError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsIndexing(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl pr-8">{paper.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Paper details including authors, abstract, and metadata
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Authors */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Authors</h3>
            <p className="text-muted-foreground">
              {paper.authors.map((a) => a.name).join(', ')}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3">
            {paper.year && (
              <Badge variant="secondary" className="gap-1">
                {paper.year}
              </Badge>
            )}
            {paper.venue && (
              <Badge variant="secondary" className="gap-1">
                {paper.venue}
              </Badge>
            )}
            {paper.citationCount !== undefined && (
              <Badge variant="secondary" className="gap-1">
                {paper.citationCount} citations
              </Badge>
            )}
            <Badge variant="outline">{paper.source}</Badge>
          </div>

          {/* Abstract */}
          {paper.abstract && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Abstract</h3>
              <p className="text-muted-foreground leading-relaxed">{paper.abstract}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            {paper.url && (
              <Button asChild>
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Paper
                </a>
              </Button>
            )}

            <Button
              onClick={handleIndex}
              disabled={isIndexing || isIndexed}
              variant="secondary"
            >
              {isIndexing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Indexing...
                </>
              ) : isIndexed ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Indexed
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Index with RAG
                </>
              )}
            </Button>

            {paper.url && (
              <Button variant="outline" asChild>
                <a
                  href={paper.url.replace('/abs/', '/pdf/')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
              </Button>
            )}
          </div>

          {/* Index Status */}
          {indexError && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{indexError}</p>
              </CardContent>
            </Card>
          )}

          {isIndexed && (
            <Card className="border-foreground/20">
              <CardContent className="pt-6">
                <p className="text-sm text-foreground">
                  Paper has been indexed! You can now ask questions about it using the RAG system.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
