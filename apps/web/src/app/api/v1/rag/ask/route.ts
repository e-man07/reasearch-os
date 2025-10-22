/**
 * API route: /api/v1/rag/ask
 * Ask questions using RAG (Retrieval-Augmented Generation)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RAGPipeline } from '@research-os/rag'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { question } = await request.json()

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    console.log('🤔 RAG Question:', question)

    // Initialize RAG pipeline components
    const { WeaviateVectorStore, EmbeddingService, RAGPipeline } = await import('@research-os/rag')
    
    const vectorStore = new WeaviateVectorStore({
      url: process.env.WEAVIATE_URL!,
      apiKey: process.env.WEAVIATE_API_KEY!,
    })

    const embeddingService = new EmbeddingService({
      apiKey: process.env.OPENAI_API_KEY!,
    })

    const ragPipeline = new RAGPipeline({
      vectorStore,
      embeddingService,
    })

    // Retrieve relevant chunks
    console.log('🔍 Searching for relevant content...')
    const retrievalContext = await ragPipeline.retrieve(question, {
      limit: 5,
      minScore: 0.5, // Lowered threshold to get more results
    })
    
    console.log('📊 Search results:', {
      totalFound: retrievalContext.chunks.length,
      scores: retrievalContext.chunks.map(c => c.score),
    })

    if (retrievalContext.chunks.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any relevant information in the indexed papers. Please make sure you've indexed some papers first by going to the search page and clicking 'Index with RAG' on papers.",
        sources: [],
      })
    }

    console.log(`✅ Found ${retrievalContext.chunks.length} relevant chunks`)

    // Build context from retrieved chunks
    const context = retrievalContext.chunks
      .map((chunk: any, index: number) => {
        const title = chunk.metadata?.paper_title || 'Unknown Paper'
        return `[Source ${index + 1}] ${title}\n${chunk.content}\n`
      })
      .join('\n---\n\n')

    // Generate answer using OpenAI
    console.log('🤖 Generating answer...')
    const completion = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful research assistant. Answer the user's question based on the provided context from research papers. 

Instructions:
- Use ONLY the information from the provided context
- Cite sources by mentioning paper titles
- If the context doesn't contain enough information, say so
- Be concise but comprehensive
- Use clear, academic language`,
        },
        {
          role: 'user',
          content: `Context from research papers:\n\n${context}\n\n---\n\nQuestion: ${question}\n\nPlease provide a detailed answer based on the context above.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const answer = completion.choices[0].message.content || 'No answer generated'

    console.log('✅ Answer generated')

    // Format sources
    const sources = retrievalContext.chunks.map((chunk: any) => ({
      paperId: chunk.paperId || chunk.metadata?.paper_id || 'unknown',
      title: chunk.metadata?.paper_title || 'Unknown Paper',
      content: chunk.content.substring(0, 200) + '...',
      score: chunk.score,
    }))

    return NextResponse.json({
      answer,
      sources,
      metadata: {
        chunksRetrieved: retrievalContext.chunks.length,
        model: process.env.LLM_MODEL || 'gpt-4o',
      },
    })
  } catch (error) {
    console.error('RAG ask error:', error)
    
    // Check if it's a Weaviate connection error
    const errorMessage = error instanceof Error ? error.message : 'Failed to process question'
    const isWeaviateError = errorMessage.includes('fetch failed') || 
                           errorMessage.includes('timeout') || 
                           errorMessage.includes('ECONNREFUSED')
    
    if (isWeaviateError) {
      return NextResponse.json(
        {
          error: 'Unable to connect to Weaviate vector database. Please check:\n\n1. Weaviate Cloud instance is running\n2. Network connectivity\n3. API credentials are correct\n\nTry again in a few moments.',
          details: errorMessage,
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
