'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Search as SearchIcon, FileText, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

interface SearchHistory {
  id: string
  query: string
  status: string
  totalResults: number
  createdAt: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [searches, setSearches] = useState<SearchHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSearchHistory()
  }, [])

  const fetchSearchHistory = async () => {
    try {
      const response = await fetch('/api/v1/searches')
      if (response.ok) {
        const data = await response.json()
        setSearches(data)
      }
    } catch (error) {
      console.error('Failed to fetch search history:', error)
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-white rounded-lg shadow-md border-2 border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <SearchIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Searches</p>
                <p className="text-3xl font-bold text-gray-900">{searches.length}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-2 border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Papers Found</p>
                <p className="text-3xl font-bold text-gray-900">
                  {searches.reduce((sum, s) => sum + s.totalResults, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border-2 border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {searches.length > 0
                    ? Math.round(
                        (searches.filter((s) => s.status === 'COMPLETED').length /
                          searches.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              href="/projects"
              className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all flex items-center gap-4"
            >
              <FileText className="w-8 h-8 text-gray-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">My Projects</h3>
                <p className="text-gray-600">Organize your research</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Searches */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Searches</h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 mt-4">Loading...</p>
            </div>
          ) : searches.length === 0 ? (
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
                      href={`/searches/${search.id}`}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
