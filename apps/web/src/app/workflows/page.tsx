'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, Loader2, FileText, Download, Search as SearchIcon, MessageSquare, ArrowRight, History, X } from 'lucide-react'
import { AgentProgress, type AgentStep } from '@/components/workflows/AgentProgress'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import WorkflowHistory from '@/components/workflows/WorkflowHistory'
import { ChatModal } from '@/components/chat/ChatModal'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Opt out of static generation due to useSearchParams
export const dynamic = 'force-dynamic'

export default function WorkflowsPage() {
  const searchParams = useSearchParams()
  const workflowId = searchParams.get('id')
  
  const [query, setQuery] = useState('')
  const [workflowType, setWorkflowType] = useState<'search' | 'analysis' | 'synthesis' | 'report' | 'full'>('full')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>()
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([])
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false)

  // Load workflow if ID is provided in URL
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId)
    }
  }, [workflowId])

  const loadWorkflow = async (id: string) => {
    setIsLoadingWorkflow(true)
    setError(undefined)
    
    try {
      const response = await fetch(`/api/v1/workflows/${id}`)
      if (!response.ok) {
        throw new Error('Failed to load workflow')
      }
      
      const workflow = await response.json()
      
      // Set the workflow data
      setQuery(workflow.query)
      setResult({
        plan: workflow.plan,
        papers: workflow.papers,
        analysis: workflow.analysis,
        report: workflow.report,
      })
      setCurrentWorkflowId(workflow.id)
      setChatSessionId(workflow.chatSessionId)
      
      // Show completed agent steps
      const completedSteps: AgentStep[] = (workflow.agentsUsed || []).map((agent: string) => ({
        agent: agent.toLowerCase() as AgentStep['agent'],
        status: 'completed' as const,
        message: 'Completed',
        startTime: Date.now(),
        endTime: Date.now(),
      }))
      setAgentSteps(completedSteps)
      
    } catch (err) {
      console.error('Error loading workflow:', err)
      setError(err instanceof Error ? err.message : 'Failed to load workflow')
    } finally {
      setIsLoadingWorkflow(false)
    }
  }

  const updateAgentStatus = (agent: AgentStep['agent'], status: AgentStep['status'], message?: string) => {
    setAgentSteps(prev => {
      const updated = [...prev]
      const index = updated.findIndex(s => s.agent === agent)
      
      if (index >= 0) {
        if (status === 'running') {
          updated[index].status = 'running'
          updated[index].startTime = Date.now()
          updated[index].message = message
        } else if (status === 'completed') {
          updated[index].status = 'completed'
          updated[index].endTime = Date.now()
          updated[index].message = message || 'Completed'
        } else if (status === 'error') {
          updated[index].status = 'error'
          updated[index].message = message || 'Error occurred'
        }
      }
      
      return updated
    })
  }

  const handleDownload = () => {
    if (!result) return

    const content = result.report || result.summary || JSON.stringify(result, null, 2)
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-report-${query.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSelectWorkflow = async (workflowId: string, workflowQuery: string) => {
    setCurrentWorkflowId(workflowId)
    setQuery(workflowQuery)
    setShowHistory(false)
    
    // Load workflow details
    try {
      const response = await fetch(`/api/v1/workflows/${workflowId}`)
      if (response.ok) {
        const workflow = await response.json()
        setResult(workflow)
        setChatSessionId(workflow.chatSessionId)
        
        // Show completed agent steps
        if (workflow.status === 'COMPLETED') {
          setAgentSteps([
            { agent: 'planner', status: 'completed' },
            { agent: 'search', status: 'completed' },
            { agent: 'synthesis', status: 'completed' },
            { agent: 'report', status: 'completed' },
          ])
        }
      }
    } catch (error) {
      console.error('Failed to load workflow:', error)
    }
  }

  const handleStartChat = () => {
    if (!result) return
    setShowChat(true)
  }

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsRunning(true)
    setError(undefined)
    setResult(null)
    
    // Initialize agent steps
    const initialSteps: AgentStep[] = [
      { agent: 'planner', status: 'pending' },
      { agent: 'search', status: 'pending' },
      { agent: 'synthesis', status: 'pending' },
      { agent: 'report', status: 'pending' },
    ]
    setAgentSteps(initialSteps)

    try {
      const response = await fetch('/api/v1/workflows/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          workflowType,
          options: {},
        }),
      })

      if (!response.ok) {
        throw new Error('Workflow failed')
      }

      // Handle Server-Sent Events stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream')
      }

      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            
            if (data.workflowId) {
              setCurrentWorkflowId(data.workflowId)
            }
            
            if (data.type === 'status') {
              updateAgentStatus(data.agent, data.status, data.message)
              
              // Mark previous agents as completed
              const agentOrder: AgentStep['agent'][] = ['planner', 'search', 'synthesis', 'report']
              const currentIndex = agentOrder.indexOf(data.agent)
              for (let i = 0; i < currentIndex; i++) {
                updateAgentStatus(agentOrder[i], 'completed')
              }
            } else if (data.type === 'complete') {
              // Mark all as completed
              updateAgentStatus('planner', 'completed')
              updateAgentStatus('search', 'completed')
              updateAgentStatus('synthesis', 'completed')
              updateAgentStatus('report', 'completed', 'Report generated successfully')
              setResult(data.result)
              setChatSessionId(data.result?.chatSessionId || null)
            } else if (data.type === 'error') {
              throw new Error(data.error)
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Mark current running step as error
      setAgentSteps(prev => {
        const updated = [...prev]
        const runningIndex = updated.findIndex(s => s.status === 'running')
        if (runningIndex >= 0) {
          updated[runningIndex].status = 'error'
          updated[runningIndex].message = 'Error occurred'
        }
        return updated
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-1">
                AI Workflows
              </h1>
              <p className="text-sm text-muted-foreground">
                Multi-agent research workflows
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
              <Link href="/search">
                <Button variant="outline" size="sm" className="gap-2">
                  <SearchIcon className="w-4 h-4" />
                  Search
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
        {/* Form and Help - Two Column Layout */}
        <div className={result ? "mb-8" : ""}>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div>
              {/* Workflow Form */}
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                  Configure Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleExecute} className="space-y-6">
                  {/* Query */}
                  <div className="space-y-2">
                    <Label htmlFor="query">Research Query *</Label>
                    <Input
                      id="query"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., attention mechanisms in transformers"
                      disabled={isRunning}
                      required
                    />
                  </div>

                  {/* Workflow Type */}
                  <div className="space-y-2">
                    <Label htmlFor="workflowType">Workflow Type</Label>
                    <Select
                      value={workflowType}
                      onValueChange={(value) => setWorkflowType(value as any)}
                      disabled={isRunning}
                    >
                      <SelectTrigger id="workflowType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="search">Search Only</SelectItem>
                        <SelectItem value="analysis">Analysis Only</SelectItem>
                        <SelectItem value="synthesis">Synthesis</SelectItem>
                        <SelectItem value="report">Report Generation</SelectItem>
                        <SelectItem value="full">Full Workflow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isRunning || !query.trim()}
                    className="w-full gap-2"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Running Workflow...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Execute Workflow</span>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Help / Progress & Results */}
          <div className="space-y-6">
            {/* Help - Show when no workflow is running */}
            {!result && !isRunning && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center min-w-[32px] w-8 h-8 bg-muted rounded-full text-foreground font-bold text-sm">1</div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Planner Agent</p>
                      <p className="text-sm text-muted-foreground">Analyzes query and creates strategy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center min-w-[32px] w-8 h-8 bg-muted rounded-full text-foreground font-bold text-sm">2</div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Search Agent</p>
                      <p className="text-sm text-muted-foreground">Finds papers via MCP connectors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center min-w-[32px] w-8 h-8 bg-muted rounded-full text-foreground font-bold text-sm">3</div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Synthesis Agent</p>
                      <p className="text-sm text-muted-foreground">Analyzes and identifies patterns</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center min-w-[32px] w-8 h-8 bg-muted rounded-full text-foreground font-bold text-sm">4</div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Report Agent</p>
                      <p className="text-sm text-muted-foreground">Generates comprehensive report</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Agent Progress */}
            {agentSteps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Agent Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <AgentProgress steps={agentSteps} />
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="font-semibold text-foreground mb-1">Error</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </div>

        {/* Result - Full Width */}
        {result && (
          <Card className="animate-in fade-in duration-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  Generated Report
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={handleStartChat}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-6 rounded-lg">
                <MarkdownRenderer content={result.report || result.summary || JSON.stringify(result, null, 2)} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Sidebar */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowHistory(false)}>
            <div
              className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Workflow History</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(false)}
                  className="h-8 w-8"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <WorkflowHistory
                currentWorkflowId={currentWorkflowId}
                onSelectWorkflow={handleSelectWorkflow}
              />
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {chatSessionId && (
          <ChatModal
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            sessionId={chatSessionId}
            searchQuery={query}
            paperCount={result?.totalPapers || result?.metadata?.totalPapers || 0}
          />
        )}
      </main>
    </div>
  )
}
