import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RAGPipeline, WeaviateVectorStore, EmbeddingService } from '@research-os/rag'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize RAG pipeline
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

// POST /api/v1/chat/:sessionId/messages
// Send message with conversation memory
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { message } = await request.json()
    const sessionId = params.sessionId

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message string required' },
        { status: 400 }
      )
    }

    // Get chat session with recent messages (for memory)
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 messages for context window
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'USER',
        content: message,
        contextPapers: [], // User messages don't have context
      },
    })

    // Build conversation history for memory (oldest to newest)
    const conversationHistory = session.messages
      .reverse()
      .map((msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: msg.content,
      }))

    // Search for relevant paper chunks using RAG
    let searchResults: Array<{
      content: string
      paperId: string
      score: number
      metadata?: Record<string, unknown>
    }> = []
    let contextText = ''
    
    try {
      const ragContext = await ragPipeline.retrieve(message, {
        limit: 10,
        minScore: 0.5, // Lower threshold to catch more results
      })

      // Filter to only include papers from this session
      console.log('📊 RAG returned chunks:', ragContext.chunks.length)
      console.log('📊 Session paper IDs:', session.paperIds)
      console.log('📊 Chunk paper IDs:', ragContext.chunks.map(c => c.paperId))
      
      searchResults = ragContext.chunks.filter((chunk) =>
        session.paperIds.includes(chunk.paperId)
      )
      
      console.log('📊 Filtered chunks:', searchResults.length)
      
      // If no results with filtering, show what we would have gotten
      if (searchResults.length === 0 && ragContext.chunks.length > 0) {
        console.log('⚠️  No chunks matched session papers, but found chunks from other papers')
        console.log('⚠️  This might indicate a paper ID mismatch issue')
      }

      // Build context from relevant chunks
      if (searchResults.length > 0) {
        contextText = searchResults
          .map(
            (result, idx) =>
              `[Source ${idx + 1}] (Relevance: ${(result.score * 100).toFixed(1)}%)\n${result.content}`
          )
          .join('\n\n')
      }
    } catch (error) {
      console.error('RAG search error:', error)
      // Continue without RAG context if search fails
    }

    const systemPrompt = `You are a friendly and enthusiastic research assistant who loves helping people understand academic papers! Think of yourself as a knowledgeable friend who's genuinely excited to share insights.

Your personality:
- Warm, conversational, and approachable (like chatting with a smart friend over coffee)
- Enthusiastic about research but never condescending
- Use natural language, contractions, and casual phrases
- Break down complex ideas into digestible, relatable explanations
- Use analogies and examples when helpful
- Show genuine interest in the user's questions
- Encourage curiosity and follow-up questions

You have access to ${session.paperCount} papers from the search: "${session.title}".

${contextText ? `Great news! I found some relevant information in the papers to help answer your question. Let me share what I discovered!` : `I'll do my best to help based on what I know about research in this area!`}

Guidelines:
- Start responses warmly (e.g., "Oh, great question!", "I'm glad you asked!", "This is interesting!")
- Explain concepts conversationally, not like a textbook
- Use "you" and "I" to make it personal
- When citing sources, weave them naturally into the conversation (e.g., "According to one of the papers [Source 1], ..." or "I found something cool in [Source 2]...")
- If you don't know something, be honest and friendly about it
- End with encouragement for more questions (e.g., "Want to know more about this?", "Curious about anything else?")
- Use emojis occasionally to add warmth (but don't overdo it!)

Remember: You're not just providing information—you're having a conversation with someone who's curious about research!`

    // Generate response with GPT-4o (with conversation memory + RAG context)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: contextText
            ? `Context from papers:\n\n${contextText}\n\nQuestion: ${message}`
            : message,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    })

    const assistantResponse = completion.choices[0].message.content || 'Sorry, I could not generate a response.'

    // Save assistant message with RAG context
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantResponse,
        contextPapers: searchResults.map((r) => r.paperId),
        relevanceScores: searchResults.map((r) => ({
          paperId: r.paperId,
          score: r.score,
        })),
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    })

    // Update session metadata
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        totalMessages: { increment: 2 }, // User + Assistant
        lastMessageAt: new Date(),
      },
    })

    console.log(`💬 Chat message processed for session: ${sessionId} (${searchResults.length} sources)`)

    return NextResponse.json({
      userMessage,
      assistantMessage,
      sources: searchResults.map((r, idx) => ({
        index: idx + 1,
        paperId: r.paperId,
        score: r.score,
        content: r.content.substring(0, 200) + '...',
      })),
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET /api/v1/chat/:sessionId/messages
// Get conversation history
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: params.sessionId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
