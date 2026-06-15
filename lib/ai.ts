import { google } from '@ai-sdk/google'
import { voyage } from 'voyage-ai-provider'

export function getGeminiModel() {
  return google(process.env.GEMINI_MODEL ?? 'gemini-3.1-flash')
}

export function getVoyageEmbeddingModel() {
  return voyage.textEmbeddingModel(process.env.VOYAGE_EMBEDDING_MODEL ?? 'voyage-3.5')
}