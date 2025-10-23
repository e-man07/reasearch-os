'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import ChatInterface from './ChatInterface'

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  searchQuery: string
  paperCount: number
}

export function ChatModal({
  isOpen,
  onClose,
  sessionId,
  searchQuery,
  paperCount,
}: ChatModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Chat with Papers</DialogTitle>
          <DialogDescription>
            Ask questions about {paperCount} indexed papers from your search: {searchQuery}
          </DialogDescription>
        </DialogHeader>
        <ChatInterface
          sessionId={sessionId}
          searchQuery={searchQuery}
          paperCount={paperCount}
        />
      </DialogContent>
    </Dialog>
  )
}
