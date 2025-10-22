'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Search as SearchIcon, FileText, TrendingUp, Clock, Workflow, MessageSquare, BookOpen, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface SearchHistory {
  id: string
  query: string
  status: string
  totalResults: number
  createdAt: string
}

interface WorkflowHistory {
  id: string
  query: string
  status: string
  totalPapers: number
  createdAt: string
  chatSessionId?: string
}

interface IndexedPaper {
  id: string
  title: string
  abstract: string
  year: number
  venue?: string
  topics: string[]
  keywords: string[]
  pdfUrl?: string
  source: string
  sourceId: string
  createdAt: string
  chunkCount: number
  usedInWorkflows: Array<{
    query: string
    date: string
  }>
  workflowCount: number
  indexedViaSearch: boolean
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [searches, setSearches] = useState<SearchHistory[]>([])
  const [workflows, setWorkflows] = useState<WorkflowHistory[]>([])
  const [indexedPapers, setIndexedPapers] = useState<IndexedPaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'searches' | 'workflows' | 'papers'>('workflows')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch searches
      const searchResponse = await fetch('/api/v1/searches')
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        setSearches(searchData)
      }

      // Fetch workflows
      const workflowResponse = await fetch('/api/v1/workflows/history')
      if (workflowResponse.ok) {
        const workflowData = await workflowResponse.json()
        setWorkflows(workflowData)
      }

      // Fetch indexed papers
      const papersResponse = await fetch('/api/v1/papers/indexed')
      if (papersResponse.ok) {
        const papersData = await papersResponse.json()
        setIndexedPapers(papersData.papers || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="text-gray-600">
            Here&apos;s an overview of your research activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="p-6 bg-white rounded-lg shadow-md border-2 border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <SearchIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Searches</p>
                <p className="text-3xl font-bold text-gray-900">{searches.length}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-2 border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Workflow className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Workflows</p>
                <p className="text-3xl font-bold text-gray-900">{workflows.length}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-2 border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Papers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {searches.reduce((sum, s) => sum + (s.totalResults || 0), 0) +
                    workflows.reduce((sum, w) => sum + (w.totalPapers || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-2 border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <MessageSquare className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Chat Sessions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {workflows.filter((w) => w.chatSessionId).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/search"
              className="p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-4"
            >
              <SearchIcon className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-semibold">New Search</h3>
                <p className="text-blue-100">Search for research papers</p>
              </div>
            </Link>

            <Link
              href="/workflows"
              className="p-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-4"
            >
              <Workflow className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-semibold">New Workflow</h3>
                <p className="text-purple-100">Generate research reports</p>
              </div>
            </Link>

            <Link
              href="/rag"
              className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all flex items-center gap-4"
            >
              <MessageSquare className="w-8 h-8 text-gray-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">RAG Chat</h3>
                <p className="text-gray-600">Chat with your papers</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('workflows')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'workflows'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4" />
                  Workflows
                </div>
              </button>
              <button
                onClick={() => setActiveTab('searches')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'searches'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SearchIcon className="w-4 h-4" />
                  Searches
                </div>
              </button>
              <button
                onClick={() => setActiveTab('papers')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'papers'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-green-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Indexed Papers ({indexedPapers.length})
                </div>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 mt-4">Loading...</p>
            </div>
          ) : activeTab === 'workflows' ? (
            workflows.length === 0 ? (
              <div className="p-12 bg-white border-2 border-gray-200 rounded-lg text-center">
                <Workflow className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No workflows yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start your first workflow to generate research reports
                </p>
                <Link
                  href="/workflows"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Workflow className="w-5 h-5" />
                  Create Workflow
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {workflows.slice(0, 10).map((workflow) => (
                  <div
                    key={workflow.id}
                    className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {workflow.query}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(workflow.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>{workflow.totalPapers} papers</span>
                          </div>
                          {workflow.chatSessionId && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>Chat available</span>
                            </div>
                          )}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              workflow.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-700'
                                : workflow.status === 'RUNNING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {workflow.status}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/workflows?id=${workflow.id}`}
                        className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        View Report
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'searches' ? (
            searches.length === 0 ? (
            <div className="p-12 bg-white border-2 border-gray-200 rounded-lg text-center">
              <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No searches yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start your first search to see results here
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <SearchIcon className="w-5 h-5" />
                Start Searching
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {searches.slice(0, 10).map((search) => (
                <div
                  key={search.id}
                  className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {search.query}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(search.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{search.totalResults} results</span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            search.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : search.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {search.status}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/search?id=${search.id}`}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      View Results
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            )
          ) : activeTab === 'papers' ? (
            indexedPapers.length === 0 ? (
              <div className="p-12 bg-white border-2 border-gray-200 rounded-lg text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No indexed papers yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Run a workflow to index papers and see them here
                </p>
                <Link
                  href="/workflows"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Workflow className="w-5 h-5" />
                  Create Workflow
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {indexedPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-green-400 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {paper.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {paper.abstract}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{paper.year}</span>
                          </div>
                          {paper.venue && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              <span>{paper.venue}</span>
                            </div>
                          )}
                          {paper.workflowCount > 0 ? (
                            <div className="flex items-center gap-1">
                              <Workflow className="w-4 h-4" />
                              <span>Used in {paper.workflowCount} workflow{paper.workflowCount !== 1 ? 's' : ''}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <SearchIcon className="w-4 h-4" />
                              <span>Indexed from search</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>{paper.chunkCount} chunks</span>
                          </div>
                        </div>
                        {paper.topics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {paper.topics.slice(0, 3).map((topic, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded"
                              >
                                {topic}
                              </span>
                            ))}
                            {paper.topics.length > 3 && (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                +{paper.topics.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Source: {paper.source} • Indexed on {new Date(paper.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {paper.pdfUrl && (
                          <a
                            href={paper.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}
