'use client'

import { useState } from 'react'
import { Sparkles, Loader2, MessageCircle, BookOpen, TrendingUp, Search as SearchIcon } from 'lucide-react'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface RAGResult {
  answer: string
  sources: Array<{
    paperId: string
    title: string
    content: string
    score: number
  }>
}

export default function RAGPage() {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RAGResult | null>(null)
  const [error, setError] = useState<string>()

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    setError(undefined)
    setResult(null)

    try {
      const response = await fetch('/api/v1/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get answer')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
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
                RAG Q&A
              </h1>
              <p className="text-sm text-muted-foreground">
                Ask questions about your indexed papers
              </p>
            </div>
            <Link href="/search">
              <Button variant="outline" size="sm" className="gap-2">
                <SearchIcon className="w-4 h-4" />
                Search
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        className="max-w-4xl mx-auto px-6 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
      >
        <div className="space-y-8">
          {/* Question Form */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleAsk} className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question about your indexed papers... (e.g., 'What are attention mechanisms in transformers?')"
                    rows={4}
                    disabled={isLoading}
                    className="resize-none"
                  />
                  <MessageCircle className="absolute right-4 top-4 text-muted-foreground w-5 h-5" />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !question.trim()}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Searching & Generating Answer...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Ask Question</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Answer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                    Answer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-6 rounded-lg">
                    <MarkdownRenderer content={result.answer} />
                  </div>
                </CardContent>
              </Card>

              {/* Sources */}
              {result.sources && result.sources.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    Sources ({result.sources.length})
                  </h3>
                  <div className="grid gap-4">
                    {result.sources.map((source, index) => (
                      <Card key={index} className="hover:bg-accent/50 transition-colors">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full font-semibold text-sm text-foreground">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground text-base mb-2">
                                  {source.title}
                                </h4>
                                <Badge variant="secondary" className="gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {Math.round(source.score * 100)}% relevance
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed bg-muted p-4 rounded-lg">
                            {source.content}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          {!result && !isLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                  How to use RAG Q&A
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-2xl">📚</div>
                    <h4 className="font-semibold text-foreground">1. Index Papers</h4>
                    <p className="text-sm text-muted-foreground">Search and index papers from the search page</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl">❓</div>
                    <h4 className="font-semibold text-foreground">2. Ask Questions</h4>
                    <p className="text-sm text-muted-foreground">Type your question in natural language</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl">🤖</div>
                    <h4 className="font-semibold text-foreground">3. Get AI Answers</h4>
                    <p className="text-sm text-muted-foreground">AI generates answers from your papers</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl">📊</div>
                    <h4 className="font-semibold text-foreground">4. View Sources</h4>
                    <p className="text-sm text-muted-foreground">See which papers were used with relevance scores</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.main>
    </div>
  )
}
