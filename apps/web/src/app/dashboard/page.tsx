'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Search as SearchIcon, FileText, Clock, Workflow as WorkflowIcon, MessageSquare, BookOpen, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

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
    <div className="min-h-screen">
      <motion.div
        className="max-w-6xl mx-auto px-6 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Welcome back, {session?.user?.name}
          </h1>
          <p className="text-muted-foreground">
            Overview of your research activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Searches</CardTitle>
              <SearchIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{searches.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workflows</CardTitle>
              <WorkflowIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflows.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Papers</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {searches.reduce((sum, s) => sum + (s.totalResults || 0), 0) +
                  workflows.reduce((sum, w) => sum + (w.totalPapers || 0), 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflows.filter((w) => w.chatSessionId).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/search">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <SearchIcon className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-base">New Search</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Search for research papers</CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href="/workflows">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <WorkflowIcon className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-base">New Workflow</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Generate research reports</CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href="/rag">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-base">RAG Chat</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Chat with your papers</CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
            <TabsList>
              <TabsTrigger value="workflows" className="gap-2">
                <WorkflowIcon className="w-4 h-4" />
                Workflows
              </TabsTrigger>
              <TabsTrigger value="searches" className="gap-2">
                <SearchIcon className="w-4 h-4" />
                Searches
              </TabsTrigger>
              <TabsTrigger value="papers" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Papers ({indexedPapers.length})
              </TabsTrigger>
            </TabsList>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ) : (
            <>
          <TabsContent value="workflows" className="space-y-4">
            {workflows.length === 0 ? (
              <Card className="p-12 text-center">
                <WorkflowIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No workflows yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start your first workflow to generate research reports
                </p>
                <Link href="/workflows">
                  <Button>
                    <WorkflowIcon className="w-4 h-4 mr-2" />
                    Create Workflow
                  </Button>
                </Link>
              </Card>
            ) : (
              workflows.slice(0, 10).map((workflow) => (
                <Card key={workflow.id} className="hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-2">{workflow.query}</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>{workflow.totalPapers} papers</span>
                          </div>
                          {workflow.chatSessionId && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>Chat</span>
                            </div>
                          )}
                          <Badge variant={workflow.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {workflow.status}
                          </Badge>
                        </div>
                      </div>
                      <Link href={`/workflows?id=${workflow.id}`}>
                        <Button variant="ghost" size="sm">
                          View Report
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="searches" className="space-y-4">
            {searches.length === 0 ? (
              <Card className="p-12 text-center">
                <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No searches yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start your first search to see results here
                </p>
                <Link href="/search">
                  <Button>
                    <SearchIcon className="w-4 h-4 mr-2" />
                    Start Searching
                  </Button>
                </Link>
              </Card>
            ) : (
              searches.slice(0, 10).map((search) => (
                <Card key={search.id} className="hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-2">{search.query}</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(search.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>{search.totalResults} results</span>
                          </div>
                          <Badge variant={search.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {search.status}
                          </Badge>
                        </div>
                      </div>
                      <Link href={`/search?id=${search.id}`}>
                        <Button variant="ghost" size="sm">
                          View Results
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="papers" className="space-y-4">
            {indexedPapers.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No indexed papers yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Run a workflow to index papers and see them here
                </p>
                <Link href="/workflows">
                  <Button>
                    <WorkflowIcon className="w-4 h-4 mr-2" />
                    Create Workflow
                  </Button>
                </Link>
              </Card>
            ) : (
              indexedPapers.map((paper) => (
                <Card key={paper.id} className="hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base mb-2">{paper.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {paper.abstract}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{paper.year}</span>
                      </div>
                      {paper.venue && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{paper.venue}</span>
                        </div>
                      )}
                      {paper.workflowCount > 0 ? (
                        <div className="flex items-center gap-1">
                          <WorkflowIcon className="w-3 h-3" />
                          <span>{paper.workflowCount} workflow{paper.workflowCount !== 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <SearchIcon className="w-3 h-3" />
                          <span>From search</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{paper.chunkCount} chunks</span>
                      </div>
                    </div>
                    {paper.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {paper.topics.slice(0, 3).map((topic, idx) => (
                          <Badge key={idx} variant="secondary">
                            {topic}
                          </Badge>
                        ))}
                        {paper.topics.length > 3 && (
                          <Badge variant="outline">
                            +{paper.topics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {paper.source} • {new Date(paper.createdAt).toLocaleDateString()}
                    </div>
                    {paper.pdfUrl && (
                      <a
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm" className="gap-2 h-8">
                          <ExternalLink className="w-3 h-3" />
                          View PDF
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          </>
          )}
          </Tabs>
        </div>
      </motion.div>
    </div>
  )
}
