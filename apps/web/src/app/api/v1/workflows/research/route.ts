/**
 * API route: /api/v1/workflows/research
 * Proxy to ADK-TS Agent Server
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'status', 
              agent: 'planner', 
              status: 'running',
              message: 'Analyzing query and creating research strategy...'
            })}\n\n`)
          )

          // Forward to agent server
          const response = await fetch(`${AGENT_SERVER_URL}/api/workflows/research`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          })

          if (!response.ok) {
            const error = await response.json()
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'error', 
                error: error.message || 'Workflow failed' 
              })}\n\n`)
            )
            controller.close()
            return
          }

          // Send search agent status
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'status', 
              agent: 'search', 
              status: 'running',
              message: 'Searching arXiv and Semantic Scholar...'
            })}\n\n`)
          )

          // Wait a bit for search
          await new Promise(resolve => setTimeout(resolve, 2000))

          // Send synthesis agent status
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'status', 
              agent: 'synthesis', 
              status: 'running',
              message: 'Analyzing papers and identifying patterns...'
            })}\n\n`)
          )

          // Wait a bit for synthesis
          await new Promise(resolve => setTimeout(resolve, 2000))

          // Send report agent status
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'status', 
              agent: 'report', 
              status: 'running',
              message: 'Generating comprehensive report...'
            })}\n\n`)
          )

          const result = await response.json()

          // Send final result
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete', 
              result 
            })}\n\n`)
          )

          controller.close()
        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : 'Internal server error' 
            })}\n\n`)
          )
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Workflow error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
