'use client'

import { PaperCard, type Paper } from './PaperCard'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface SearchResultsProps {
  papers: Paper[]
  isLoading: boolean
  error?: string
  query?: string
  onSelectPaper?: (paper: Paper) => void
}

export function SearchResults({
  papers,
  isLoading,
  error,
  query,
  onSelectPaper,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Searching for papers...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Search Error</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (papers.length === 0 && query) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No Results Found</h3>
          <p className="text-muted-foreground">
            No papers found for &quot;{query}&quot;. Try different keywords or sources.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (papers.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="w-5 h-5" />
        <span>
          Found <strong className="text-foreground">{papers.length}</strong> papers
          {query && (
            <>
              {' '}
              for &quot;<strong className="text-foreground">{query}</strong>&quot;
            </>
          )}
        </span>
      </div>

      {/* Papers Grid */}
      <div className="space-y-4">
        {papers.map((paper) => (
          <PaperCard key={paper.id} paper={paper} onSelect={onSelectPaper} />
        ))}
      </div>
    </div>
  )
}
