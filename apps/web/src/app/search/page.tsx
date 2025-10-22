'use client'

import { useState } from 'react'
import { SearchForm, type SearchFormData } from '@/components/search/SearchForm'
import { SearchResults } from '@/components/search/SearchResults'
import { PaperDetailModal } from '@/components/search/PaperDetailModal'
import { type Paper } from '@/components/search/PaperCard'
import { MessageSquare, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function SearchPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [currentQuery, setCurrentQuery] = useState<string>()
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)

  const handleSearch = async (data: SearchFormData) => {
    setIsLoading(true)
    setError(undefined)
    setCurrentQuery(data.query)
    setPapers([])

    try {
      // Search papers using MCP connectors
      const response = await fetch('/api/v1/papers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: data.query,
          sources: data.sources,
          yearFrom: data.yearFrom,
          yearTo: data.yearTo,
          maxResults: data.maxResults,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const result = await response.json()
      
      // Transform papers to match Paper interface
      const transformedPapers: Paper[] = result.papers.map((paper: any) => ({
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        year: paper.year,
        venue: paper.venue,
        citationCount: paper.citationCount,
        url: paper.url,
        source: paper.source,
      }))

      setPapers(transformedPapers)

      if (result.errors && result.errors.length > 0) {
        console.warn('Some sources failed:', result.errors)
        // Show warning but don't fail if we got some results
        if (transformedPapers.length === 0) {
          setError(`All sources failed: ${result.errors.map((e: any) => e.error).join(', ')}`)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPaper = (paper: Paper) => {
    setSelectedPaper(paper)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                📚 Paper Search
              </h1>
              <p className="text-gray-600">
                Search across arXiv and Semantic Scholar • Powered by MCP Connectors
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-3">
              <Link
                href="/workflows"
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">AI Workflows</span>
              </Link>
              <Link
                href="/rag"
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">Ask Questions</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Info Banner */}
        {papers.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">Found relevant papers?</p>
                  <p className="text-sm text-gray-600">Index them and ask questions using RAG Q&A</p>
                </div>
              </div>
              <Link
                href="/rag"
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all hover:scale-105"
              >
                <span>Go to Q&A</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
        
        <div className="space-y-8">
          {/* Search Form */}
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />

          {/* Results */}
          <SearchResults
            papers={papers}
            isLoading={isLoading}
            error={error}
            query={currentQuery}
            onSelectPaper={handleSelectPaper}
          />
        </div>
      </main>

      {/* Paper Detail Modal */}
      {selectedPaper && (
        <PaperDetailModal
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
        />
      )}
    </div>
  )
}
