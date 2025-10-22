/**
 * API route: /api/v1/searches
 * Create and list searches
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateSearchSchema = z.object({
  query: z.string().min(1),
  projectId: z.string().uuid().optional(),
  filters: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = CreateSearchSchema.parse(body)

    // TODO: Get userId from session
    const userId = 'temp-user-id'

    const search = await prisma.search.create({
      data: {
        query: data.query,
        projectId: data.projectId,
        userId,
        filters: data.filters as any,
        status: 'PENDING',
      },
    })

    return NextResponse.json(search, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session
    const userId = 'temp-user-id'

    const searches = await prisma.search.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json(searches)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
