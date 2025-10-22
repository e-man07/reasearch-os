'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, Loader2, FileText, Download, Search as SearchIcon, MessageSquare, ArrowRight, History, X } from 'lucide-react'
import { AgentProgress, type AgentStep } from '@/components/workflows/AgentProgress'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import WorkflowHistory from '@/components/workflows/WorkflowHistory'
import ChatInterface from '@/components/chat/ChatInterface'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                ✨ AI Workflows
              </h1>
              <p className="text-gray-600">
                Multi-agent research workflows • Powered by ADK-TS
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="font-medium">History</span>
              </button>
              <Link
                href="/search"
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <SearchIcon className="w-4 h-4" />
                <span className="font-medium">Search Papers</span>
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
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Workflow Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Configure Workflow
              </h2>

              <form onSubmit={handleExecute} className="space-y-6">
                {/* Query */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Research Query *
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., attention mechanisms in transformers"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all"
                    disabled={isRunning}
                    required
                  />
                </div>

                {/* Workflow Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Workflow Type
                  </label>
                  <select
                    value={workflowType}
                    onChange={(e) => setWorkflowType(e.target.value as any)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all"
                    disabled={isRunning}
                  >
                    <option value="search">🔍 Search Only</option>
                    <option value="analysis">📊 Analysis Only</option>
                    <option value="synthesis">💡 Synthesis</option>
                    <option value="report">📄 Report Generation</option>
                    <option value="full">🚀 Full Workflow</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isRunning || !query.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
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
                </button>
              </form>
            </div>

            {/* Help */}
            {!result && !isRunning && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  How It Works
                </h3>
                <div className="space-y-3 text-sm text-purple-800">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-purple-200 rounded-full text-purple-900 font-bold text-xs">1</div>
                    <div>
                      <p className="font-semibold">Planner Agent</p>
                      <p className="text-purple-700">Analyzes query and creates strategy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-purple-200 rounded-full text-purple-900 font-bold text-xs">2</div>
                    <div>
                      <p className="font-semibold">Search Agent</p>
                      <p className="text-purple-700">Finds papers via MCP connectors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-purple-200 rounded-full text-purple-900 font-bold text-xs">3</div>
                    <div>
                      <p className="font-semibold">Synthesis Agent</p>
                      <p className="text-purple-700">Analyzes and identifies patterns</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-purple-200 rounded-full text-purple-900 font-bold text-xs">4</div>
                    <div>
                      <p className="font-semibold">Report Agent</p>
                      <p className="text-purple-700">Generates comprehensive report</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Progress & Results */}
          <div className="space-y-6">
            {/* Agent Progress */}
            {agentSteps.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Agent Progress
                </h2>
                <AgentProgress steps={agentSteps} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700">
                <p className="font-semibold mb-1">❌ Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-green-100 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-green-600" />
                    Generated Report
                  </h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleStartChat}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Chat</span>
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl">
                  <MarkdownRenderer content={result.report || result.summary || JSON.stringify(result, null, 2)} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowHistory(false)}>
            <div 
              className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Workflow History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <WorkflowHistory
                currentWorkflowId={currentWorkflowId}
                onSelectWorkflow={handleSelectWorkflow}
              />
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {showChat && chatSessionId && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setShowChat(false)}>
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  Chat about Report
                </h2>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatInterface 
                  sessionId={chatSessionId} 
                  searchQuery={query}
                  paperCount={result?.totalPapers || result?.metadata?.totalPapers || 0}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
