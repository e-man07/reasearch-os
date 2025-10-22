/**
 * API route: /api/v1/papers/:paperId/index
 * Index a paper in the RAG system (chunk + embed + store in Weaviate)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TextChunker } from '@research-os/ingestion'
import { WeaviateVectorStore, EmbeddingService, RAGPipeline } from '@research-os/rag'

export async function POST(
  request: NextRequest,
  { params }: { params: { paperId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paperId } = params

    // Get paper from database
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
    })

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
    }

    // Check if already indexed
    const existingChunks = await prisma.chunk.findMany({
      where: { paperId },
    })

    if (existingChunks.length > 0) {
      return NextResponse.json({
        message: 'Paper already indexed',
        chunkCount: existingChunks.length,
      })
    }

    // Initialize RAG components
    const vectorStore = new WeaviateVectorStore({
      url: process.env.WEAVIATE_URL!,
      apiKey: process.env.WEAVIATE_API_KEY,
    })

    const embeddingService = new EmbeddingService({
      apiKey: process.env.OPENAI_API_KEY!,
    })

    const ragPipeline = new RAGPipeline({
      vectorStore,
      embeddingService,
    })

    // Chunk the paper
    const chunker = new TextChunker({
      chunkSize: 512,
      chunkOverlap: 50,
    })

    const content = `${paper.title}\n\n${paper.abstract}`
    const rawChunks = chunker.chunk(content, paper.id)

    console.log(`Created ${rawChunks.length} chunks for paper ${paper.id}`)

    // Add paper metadata to chunks
    const chunksWithMetadata = rawChunks.map((chunk) => ({
      ...chunk,
      metadata: {
        paper_id: paper.id,
        paper_title: paper.title,
        paper_year: paper.year,
        paper_venue: paper.venue,
        paper_arxiv_id: paper.arxivId,
      },
    }))

    // Save chunks to database
    await prisma.chunk.createMany({
      data: chunksWithMetadata.map((chunk) => ({
        paperId: paper.id,
        content: chunk.content,
        chunkIndex: chunk.chunk_index,
        section: chunk.section || 'abstract',
        metadata: chunk.metadata as any,
      })),
    })

    // Index in Weaviate with metadata
    await ragPipeline.indexChunks(chunksWithMetadata)

    console.log(`Indexed ${chunksWithMetadata.length} chunks in Weaviate`)

    return NextResponse.json({
      message: 'Paper indexed successfully',
      paperId: paper.id,
      chunkCount: chunksWithMetadata.length,
    })
  } catch (error) {
    console.error('Indexing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
