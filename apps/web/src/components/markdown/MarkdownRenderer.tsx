'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        h1: ({ node, ...props }) => (
          <h1 className="text-2xl font-bold text-foreground mt-6 mb-4" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-xl font-bold text-foreground mt-5 mb-3" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-lg font-semibold text-foreground mt-4 mb-2" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="text-muted-foreground leading-relaxed mb-4" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="ml-4" {...props} />
        ),
        code: ({ node, inline, ...props }: any) =>
          inline ? (
            <code className="px-1.5 py-0.5 bg-muted text-foreground rounded text-sm font-mono" {...props} />
          ) : (
            <code className="block p-4 bg-card border border-border text-foreground rounded-lg overflow-x-auto text-sm font-mono mb-4" {...props} />
          ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground my-4" {...props} />
        ),
        a: ({ node, ...props }) => (
          <a className="text-foreground hover:text-muted-foreground underline" {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-bold text-foreground" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="italic text-muted-foreground" {...props} />
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
