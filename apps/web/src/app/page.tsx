import Link from 'next/link'
import { Search, BookOpen, FileText, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 py-24">
        <div className="max-w-4xl text-center space-y-8">
          {/* Logo/Title */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-gray-900">
              Research<span className="text-blue-600">OS</span>
            </h1>
            <p className="text-2xl text-gray-600">
              AI-Powered Research Discovery & Synthesis
            </p>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Discover, analyze, and synthesize research papers using advanced AI.
            Search across arXiv and Semantic Scholar, generate insights with RAG,
            and create comprehensive research reports.
          </p>

          {/* CTA Button */}
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <Search className="w-6 h-6" />
            Start Searching
          </Link>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <Search className="w-12 h-12 text-blue-600 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
              <p className="text-gray-600">
                Search across multiple sources with advanced filters
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <Sparkles className="w-12 h-12 text-blue-600 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">AI Synthesis</h3>
              <p className="text-gray-600">
                Generate insights and summaries using RAG
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <FileText className="w-12 h-12 text-blue-600 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Auto Reports</h3>
              <p className="text-gray-600">
                Create comprehensive research reports automatically
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-12 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">2</div>
              <div className="text-sm text-gray-600">Data Sources</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">5</div>
              <div className="text-sm text-gray-600">AI Agents</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">∞</div>
              <div className="text-sm text-gray-600">Possibilities</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
