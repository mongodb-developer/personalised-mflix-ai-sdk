import { createAgentUIStreamResponse, isLoopFinished, ToolLoopAgent, tool } from 'ai'
import { z } from 'zod'
import { getGeminiModel } from '../../../lib/ai'
import { getMemory } from '../../../lib/memory'
import { searchMovies } from '../../../lib/movies'

export const runtime = 'nodejs'

const chatOptionsSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  prompt: z.string(),
})

const searchMoviesTool = tool({
  description:
    'Search the MongoDB sample_mflix movies collection. Use this before recommending specific titles so answers are grounded in the dataset.',
  inputSchema: z.object({
    query: z.string().describe('Movie title, genre, person, mood, or plot keyword to search for.'),
    limit: z.number().int().min(1).max(10).default(6),
  }),
  execute: async (input) => {
    return searchMovies(input.query, input.limit)
  },
})

function createMflixAgent() {
  const mongodbMemory = getMemory()

  return new ToolLoopAgent({
    model: getGeminiModel(),
    instructions:
      'You are the personalised mflix curator. Recommend movies only from the MongoDB sample_mflix dataset. Use memory to remember durable preferences such as liked genres, languages, directors, actors, eras, and content to avoid. Use the movie search tool before listing titles. Keep copy concise, clear, and technical-but-warm. Do not use emoji.',
    tools: {
      ...mongodbMemory({ userId: 'demo-user', sessionId: 'demo-session' }),
      searchMovies: searchMoviesTool,
    },
    callOptionsSchema: chatOptionsSchema,
    prepareCall: async ({ options, prompt: _prompt, messages: _messages, ...settings }) => {
      const { userId, sessionId, prompt } = options!
      const history = await mongodbMemory.loadSession({ userId, sessionId })

      return {
        ...settings,
        tools: {
          ...mongodbMemory({ userId, sessionId }),
          searchMovies: searchMoviesTool,
        },
        messages: [...history, { role: 'user' as const, content: prompt }],
        experimental_context: { userId, sessionId, prompt },
      }
    },
    onFinish: mongodbMemory.onFinish(),
    stopWhen: isLoopFinished(),
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const prompt = typeof body.prompt === 'string' ? body.prompt : extractPromptFromMessages(body.messages)
  const userId = typeof body.userId === 'string' ? body.userId : 'demo-user'
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : 'demo-session'
  const uiMessages = normalizeUIMessages(body.messages)

  return createAgentUIStreamResponse({
    agent: createMflixAgent(),
    uiMessages,
    options: { userId, sessionId, prompt },
  })
}

function normalizeUIMessages(messages: unknown) {
  if (!Array.isArray(messages)) return []

  return messages.map((message, index) => {
    const candidate = message as {
      id?: unknown
      role?: unknown
      parts?: unknown
      content?: unknown
    }

    const role = candidate.role === 'assistant' || candidate.role === 'user' ? candidate.role : 'user'
    const parts = Array.isArray(candidate.parts)
      ? candidate.parts
      : typeof candidate.content === 'string'
        ? [{ type: 'text', text: candidate.content }]
        : []

    return {
      id: typeof candidate.id === 'string' ? candidate.id : `message-${index}`,
      role,
      parts,
    }
  })
}

function extractPromptFromMessages(messages: unknown) {
  if (!Array.isArray(messages) || messages.length === 0) return 'Recommend a movie for me.'
  const last = messages[messages.length - 1] as { content?: unknown; parts?: Array<{ type?: string; text?: string }> }

  if (typeof last.content === 'string') return last.content

  const textParts = last.parts?.filter((part) => part.type === 'text').map((part) => part.text ?? '') ?? []
  return textParts.join('\n').trim() || 'Recommend a movie for me.'
}