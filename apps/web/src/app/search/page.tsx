'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchForm, type SearchFormData } from '@/components/search/SearchForm'
import { SearchResults } from '@/components/search/SearchResults'
import { PaperDetailModal } from '@/components/search/PaperDetailModal'
import { type Paper } from '@/components/search/PaperCard'
import IndexPapersButton from '@/components/search/IndexPapersButton'
import ChatInterface from '@/components/chat/ChatInterface'
import ChatHistory from '@/components/chat/ChatHistory'
import { createOrGetChatSession } from '@/lib/chat-utils'
import { MessageSquare, Sparkles, Search, Loader2, History } from 'lucide-react'
import Link from 'next/link'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const searchIdFromUrl = searchParams.get('id')
  
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [currentQuery, setCurrentQuery] = useState<string>()
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [searchId, setSearchId] = useState<string | null>(null)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'results' | 'chat' | 'history'>('results')
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

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
  }, [searchIdFromUrl])

  const loadSearch = async (id: string) => {
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
  }

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
    setActiveTab('chat')
  }

  const handleSelectSession = (sessionId: string, searchId: string, title: string) => {
    setChatSessionId(sessionId)
    setSearchId(searchId)
    setCurrentQuery(title.replace('Chat: ', ''))
    setActiveTab('chat')
    setShowHistory(false)
    
    // Save to localStorage
    localStorage.setItem('lastSearchId', searchId)
    localStorage.setItem('lastSearchQuery', title.replace('Chat: ', ''))
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
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="font-medium">Chat History</span>
              </button>
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
        {/* Chat History Sidebar */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowHistory(false)}>
            <div 
              className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Chat History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
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
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Welcome back! 👋</p>
                    <p className="text-sm text-gray-600">
                      You have a previous chat session for "{currentQuery}"
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all"
                >
                  Continue Chat
                </button>
              </div>
            </div>
          )}

          {/* Search Form */}
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />

          {/* Tabs (shown when we have results OR existing chat session) */}
          {(papers.length > 0 || chatSessionId) && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('results')}
                  className={`flex-1 px-6 py-4 font-semibold transition-all ${
                    activeTab === 'results'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" />
                    <span>Search Results{papers.length > 0 ? ` (${papers.length})` : ''}</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  disabled={!chatSessionId}
                  className={`flex-1 px-6 py-4 font-semibold transition-all ${
                    activeTab === 'chat'
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                      : chatSessionId
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Chat with Papers</span>
                    {!chatSessionId && (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">Index first</span>
                    )}
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'results' && (
                  <div className="space-y-6">
                    {/* Index Papers Button */}
                    {searchId && !chatSessionId && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                            <div>
                              <p className="font-bold text-gray-900 text-lg">Ready to chat with these papers?</p>
                              <p className="text-sm text-gray-600">Index them to enable AI-powered Q&A with conversation memory</p>
                            </div>
                          </div>
                          <IndexPapersButton
                            paperIds={papers.map(p => p.id)}
                            searchId={searchId}
                            onComplete={handleIndexComplete}
                          />
                        </div>
                      </div>
                    )}

                    {/* Chat Ready Banner */}
                    {chatSessionId && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-6 h-6 text-green-600" />
                            <div>
                              <p className="font-semibold text-gray-900">Chat is ready!</p>
                              <p className="text-sm text-gray-600">Switch to the Chat tab to ask questions</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab('chat')}
                            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all"
                          >
                            Open Chat
                          </button>
                        </div>
                      </div>
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

                {activeTab === 'chat' && (
                  <div>
                    {chatSessionId ? (
                      <ChatInterface
                        sessionId={chatSessionId}
                        searchQuery={currentQuery || 'your search'}
                        paperCount={papers.length}
                      />
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">No chat session yet</p>
                        <p className="text-sm">Index papers first to start chatting</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Results State */}
          {!isLoading && papers.length === 0 && !error && !chatSessionId && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Start by searching for papers</p>
              <p className="text-sm">Use the search form above to find relevant research</p>
            </div>
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
    </div>
  )
}
