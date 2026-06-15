import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = process.env.MONGODB_URI

if (!uri) {
  console.warn('MONGODB_URI is not set. API routes will fail until it is configured.')
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
}

type GlobalWithMongo = typeof globalThis & {
  _personalisedMflixClient?: MongoClient
  _personalisedMflixClientPromise?: Promise<MongoClient>
}

const globalForMongo = globalThis as GlobalWithMongo

export function getMongoClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('MONGODB_URI is required')
  }

  if (!globalForMongo._personalisedMflixClient) {
    globalForMongo._personalisedMflixClient = new MongoClient(uri, options)
  }

  if (!globalForMongo._personalisedMflixClientPromise) {
    globalForMongo._personalisedMflixClientPromise = globalForMongo._personalisedMflixClient.connect()
  }

  return globalForMongo._personalisedMflixClientPromise
}

export async function getMflixDb() {
  const client = await getMongoClient()
  return client.db(process.env.MFLIX_DB_NAME ?? 'sample_mflix')
}