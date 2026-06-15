import { generateText } from 'ai'
import { getGeminiModel } from './ai'
import { getMemory } from './memory'
import { findMovies } from './movies'
import type { PreferenceInput, RecommendationResponse } from './types'

function preferenceStatement(input: PreferenceInput) {
  const parts = [
    input.genres?.length ? `genres: ${input.genres.join(', ')}` : undefined,
    input.mood ? `mood: ${input.mood}` : undefined,
    input.language ? `language: ${input.language}` : undefined,
    input.minYear ? `after ${input.minYear}` : undefined,
    input.maxYear ? `before ${input.maxYear}` : undefined,
    input.minRating ? `minimum IMDb rating ${input.minRating}` : undefined,
    input.avoid ? `avoid: ${input.avoid}` : undefined,
  ].filter(Boolean)

  return `Movie preference for personalised mflix: ${parts.join('; ') || 'open to high quality recommendations'}`
}

export async function getRecommendations(input: PreferenceInput): Promise<RecommendationResponse> {
  const memory = getMemory()
  const statement = preferenceStatement(input)

  await memory.store.semanticSave(input.userId, 'movie preferences', statement, {
    importance: 8,
    tags: ['mflix', 'movies', 'preferences'],
  })

  const memories = await memory.store.semanticSearch(input.userId, statement, 6)
  const memoryStatements = memories.map((item) => item.description)
  const recommendations = await findMovies(input, memoryStatements, 9)

  if (recommendations.length === 0) {
    return {
      recommendations: [],
      memory: memoryStatements,
      summary: 'No matching titles were found. Try widening the year range or lowering the minimum rating.',
    }
  }

  const { text } = await generateText({
    model: getGeminiModel(),
    system:
      'You are an expert film curator for a MongoDB sample_mflix demo. Write concise, technical-but-warm product copy. Do not use emoji. Explain recommendations using evidence from movie metadata and user preferences.',
    prompt: `User preferences: ${statement}\n\nKnown memory:\n${memoryStatements.map((m) => `- ${m}`).join('\n')}\n\nRecommended movies:\n${recommendations
      .map((movie) => `- ${movie.title} (${movie.year ?? 'unknown'}), genres: ${movie.genres.join(', ')}, IMDb: ${movie.imdbRating ?? 'n/a'}, plot: ${movie.plot.slice(0, 220)}`)
      .join('\n')}\n\nReturn one short paragraph explaining the recommendation set.`,
  })

  return {
    recommendations: recommendations.map((movie) => ({
      ...movie,
      matchReason: buildLocalMatchReason(movie.genres, memoryStatements, input.mood),
    })),
    memory: memoryStatements,
    summary: text,
  }
}

function buildLocalMatchReason(genres: string[], memories: string[], mood?: string) {
  const genreMatch = genres.find((genre) => memories.some((memory) => memory.toLowerCase().includes(genre.toLowerCase())))
  if (genreMatch) return `Matches your remembered interest in ${genreMatch}.`
  if (mood) return `Selected for the ${mood} viewing mood.`
  return 'Selected from highly rated sample_mflix titles.'
}