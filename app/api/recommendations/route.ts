import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getRecommendations } from '../../../lib/recommendations'

export const runtime = 'nodejs'

const recommendationSchema = z.object({
  userId: z.string().min(1).default('demo-user'),
  sessionId: z.string().optional(),
  genres: z.array(z.string()).optional(),
  mood: z.string().optional(),
  language: z.string().optional(),
  minYear: z.number().int().min(1900).max(2035).optional(),
  maxYear: z.number().int().min(1900).max(2035).optional(),
  minRating: z.number().min(0).max(10).optional(),
  avoid: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = recommendationSchema.parse(body)
    const result = await getRecommendations(input)

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to generate recommendations',
      },
      { status: 500 },
    )
  }
}