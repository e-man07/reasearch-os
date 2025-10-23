'use client'

import { useState } from 'react'
import { Loader2, MessageSquare, CheckCircle2 } from 'lucide-react'
import { indexPapersWithChat } from '@/lib/chat-utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface IndexPapersButtonProps {
  paperIds: string[]
  searchId: string
  onComplete?: (chatSessionId: string) => void
}

export default function IndexPapersButton({
  paperIds,
  searchId,
  onComplete,
}: IndexPapersButtonProps) {
  const [isIndexing, setIsIndexing] = useState(false)
  const [progress, setProgress] = useState({ indexed: 0, total: 0 })
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleIndex = async () => {
    setIsIndexing(true)
    setError(null)
    setProgress({ indexed: 0, total: paperIds.length })

    try {
      const result = await indexPapersWithChat(
        paperIds,
        searchId,
        (indexed, total) => {
          setProgress({ indexed, total })
        }
      )

      setIsComplete(true)
      console.log(`✅ Indexed ${result.indexed} papers, chat session: ${result.chatSessionId}`)
      
      // Notify parent component
      onComplete?.(result.chatSessionId)
    } catch (error) {
      console.error('Indexing error:', error)
      setError(error instanceof Error ? error.message : 'Failed to index papers')
    } finally {
      setIsIndexing(false)
    }
  }

  if (isComplete) {
    return (
      <div className="flex items-center gap-2 text-foreground">
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-sm font-medium">
          Chat ready! {progress.indexed} papers indexed
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleIndex}
        disabled={isIndexing || paperIds.length === 0}
      >
        {isIndexing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Indexing... {progress.indexed}/{progress.total}
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4 mr-2" />
            Index Papers & Start Chat
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {isIndexing && (
        <Progress
          value={(progress.indexed / progress.total) * 100}
          className="w-full"
        />
      )}
    </div>
  )
}
