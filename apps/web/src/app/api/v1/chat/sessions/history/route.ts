import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/v1/chat/sessions/history
// Get all chat sessions for the current user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all chat sessions for user's searches
    const chatSessions = await prisma.chatSession.findMany({
      where: {
        search: {
          userId: session.user.id,
        },
      },
      orderBy: {
        lastMessageAt: 'desc', // Most recent first
      },
      select: {
        id: true,
        searchId: true,
        title: true,
        description: true,
        paperCount: true,
        totalMessages: true,
        lastMessageAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(chatSessions)
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}
