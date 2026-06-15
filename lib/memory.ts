import { createMongoDBMemory } from '@mongodb-developer/vercel-ai-memory'
import { getVoyageEmbeddingModel } from './ai'

type GlobalWithMemory = typeof globalThis & {
  _personalisedMflixMemory?: ReturnType<typeof createMongoDBMemory>
}

const globalForMemory = globalThis as GlobalWithMemory

export function getMemory() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required')
  }

  if (!globalForMemory._personalisedMflixMemory) {
    globalForMemory._personalisedMflixMemory = createMongoDBMemory({
      uri: process.env.MONGODB_URI,
      embedder: getVoyageEmbeddingModel(),
      topology: {
        dbName: process.env.MEMORY_DB_NAME ?? 'personalised_mflix_memory',
        hideToolCommands: ['session'],
        keepHistory: false,
      },
      retention: {
        session: { mode: 'ttl', ttlSeconds: 60 * 60 * 24 * 7 },
        scratchpad: { mode: 'ttl', ttlSeconds: 60 * 60 * 2 },
      },
      defaults: {
        searchLimit: 6,
        sessionRecentLimit: 30,
        similarity: 'cosine',
      },
    })
  }

  return globalForMemory._personalisedMflixMemory
}