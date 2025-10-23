'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchForm, type SearchFormData } from '@/components/search/SearchForm'
import { SearchResults } from '@/components/search/SearchResults'
import { PaperDetailModal } from '@/components/search/PaperDetailModal'
import { type Paper } from '@/components/search/PaperCard'
import IndexPapersButton from '@/components/search/IndexPapersButton'
import { ChatModal } from '@/components/chat/ChatModal'
import ChatHistory from '@/components/chat/ChatHistory'
import { createOrGetChatSession } from '@/lib/chat-utils'
import { MessageSquare, Sparkles, Search, Loader2, History } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const searchIdFromUrl = searchParams.get('id')
  
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [currentQuery, setCurrentQuery] = useState<string>()
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [searchId, setSearchId] = useState<string | null>(null)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)

  const loadSearch = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(undefined)
    
    try {
      const response = await fetch(`/api/v1/searches/${id}`)
      if (!response.ok) {
        throw new Error('Failed to load search')
      }
      
      const search = await response.json()
      
      // Set search data
      setSearchId(search.id)
      setCurrentQuery(search.query)
      
      // Load papers for this search
      // Note: We need to fetch papers associated with this search
      // For now, we'll just set the search ID and query
      // The user can see the search was loaded
      
      // Check for chat session
      checkForExistingChatSession(search.id)
      
    } catch (err) {
      console.error('Error loading search:', err)
      setError(err instanceof Error ? err.message : 'Failed to load search')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load search from URL parameter or localStorage
  useEffect(() => {
    if (searchIdFromUrl) {
      // Load search from URL
      loadSearch(searchIdFromUrl)
    } else {
      // Load last search session from localStorage
      const savedSearchId = localStorage.getItem('lastSearchId')
      const savedQuery = localStorage.getItem('lastSearchQuery')

      if (savedSearchId && savedQuery) {
        setSearchId(savedSearchId)
        setCurrentQuery(savedQuery)
        checkForExistingChatSession(savedSearchId)
      }
    }
  }, [searchIdFromUrl, loadSearch])

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
      
      // Save searchId for chat session
      setSearchId(result.searchId)
      
      // Save to localStorage for persistence
      localStorage.setItem('lastSearchId', result.searchId)
      localStorage.setItem('lastSearchQuery', data.query)
      
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
      
      // Check if chat session already exists
      if (result.searchId) {
        checkForExistingChatSession(result.searchId)
      }

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

  const checkForExistingChatSession = async (searchId: string) => {
    try {
      const response = await fetch(`/api/v1/chat/sessions?searchId=${searchId}`)
      if (response.ok) {
        const session = await response.json()
        setChatSessionId(session.id)
        
        // If we have a chat session, we might want to show it
        if (session.totalMessages > 0) {
          // User has previous messages, maybe switch to chat tab
          console.log(`Found existing chat session with ${session.totalMessages} messages`)
        }
      }
    } catch (error) {
      // Session doesn't exist yet, that's okay
    }
  }

  const handleIndexComplete = (sessionId: string) => {
    setChatSessionId(sessionId)
    setShowChatModal(true)
  }

  const handleSelectSession = (sessionId: string, searchId: string, title: string) => {
    setChatSessionId(sessionId)
    setSearchId(searchId)
    setCurrentQuery(title.replace('Chat: ', ''))
    setShowChatModal(true)
    setShowHistory(false)

    // Save to localStorage
    localStorage.setItem('lastSearchId', searchId)
    localStorage.setItem('lastSearchQuery', title.replace('Chat: ', ''))
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-1">
                Paper Search
              </h1>
              <p className="text-sm text-muted-foreground">
                Search across arXiv and Semantic Scholar
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowHistory(!showHistory)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <History className="w-4 h-4" />
                History
              </Button>
              <Link href="/workflows">
                <Button variant="outline" size="sm" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Workflows
                </Button>
              </Link>
              <Link href="/rag">
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Q&A
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Chat History Sidebar */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowHistory(false)}>
            <div
              className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Chat History</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(false)}
                  className="h-8 w-8"
                >
                  <span className="text-muted-foreground">✕</span>
                </Button>
              </div>
              <ChatHistory
                currentSessionId={chatSessionId}
                onSelectSession={handleSelectSession}
              />
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Previous Session Banner */}
          {chatSessionId && !papers.length && currentQuery && (
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">Welcome back</p>
                      <p className="text-sm text-muted-foreground">
                        You have a previous chat session for "{currentQuery}"
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowChatModal(true)}
                    size="default"
                  >
                    Continue Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Form */}
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />

          {/* Search Results */}
          {papers.length > 0 && (
            <div className="space-y-6">
              {/* Index Papers Button */}
              {searchId && !chatSessionId && (
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="font-semibold text-foreground text-base">Ready to chat with these papers?</p>
                          <p className="text-sm text-muted-foreground">Index them to enable AI-powered Q&A with conversation memory</p>
                        </div>
                      </div>
                      <IndexPapersButton
                        paperIds={papers.map(p => p.id)}
                        searchId={searchId}
                        onComplete={handleIndexComplete}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chat Ready Banner */}
              {chatSessionId && (
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-6 h-6 text-muted-foreground" />
                        <div>
                          <p className="font-semibold text-foreground">Chat is ready</p>
                          <p className="text-sm text-muted-foreground">Click to open chat and ask questions</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowChatModal(true)}
                        size="default"
                      >
                        Open Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results */}
              <SearchResults
                papers={papers}
                isLoading={false}
                error={error}
                query={currentQuery}
                onSelectPaper={handleSelectPaper}
              />
            </div>
          )}

          {/* No Results State */}
          {!isLoading && papers.length === 0 && !error && !chatSessionId && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-base font-semibold text-foreground mb-2">Start by searching for papers</p>
                <p className="text-sm text-muted-foreground">Use the search form above to find relevant research</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Paper Detail Modal */}
      {selectedPaper && (
        <PaperDetailModal
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
        />
      )}

      {/* Chat Modal */}
      {chatSessionId && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          sessionId={chatSessionId}
          searchQuery={currentQuery || 'your search'}
          paperCount={papers.length}
        />
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
