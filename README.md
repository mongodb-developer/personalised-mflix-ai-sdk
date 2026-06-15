# Personalised mflix — AI SDK + MongoDB Atlas template

A Next.js movie recommendation app that combines MongoDB Atlas `sample_mflix` data with the Vercel AI SDK and MongoDB-backed memory. It recommends movies, remembers your stated preferences across sessions, and grounds every answer in real movie data.

Built with:

- **MongoDB Atlas** `sample_mflix.movies` for grounded movie data
- **Gemini Flash** via the Vercel AI SDK Google provider
- **VoyageAI** embeddings via `voyage-ai-provider`
- **`@mongodb-developer/vercel-ai-memory`** for MongoDB-backed session and semantic memory
- **LeafyGreen-inspired** product UI

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmongodb-developer%2Fpersonalised-mflix-ai-sdk&env=MONGODB_URI,GOOGLE_GENERATIVE_AI_API_KEY,VOYAGE_API_KEY&envDescription=Atlas%20connection%20string%20and%20AI%20provider%20API%20keys&envLink=https%3A%2F%2Fgithub.com%2Fmongodb-developer%2Fpersonalised-mflix-ai-sdk%23environment-variables)

The deploy flow only asks for the **three required secrets**. Everything else has sensible defaults baked into the code (see [Environment variables](#environment-variables)).

### Prerequisites

1. **MongoDB Atlas cluster** with the `sample_mflix` sample dataset loaded.
   See the [sample data guide](https://www.mongodb.com/docs/atlas/sample-data/sample-mflix/).
2. **Google Generative AI API key** for Gemini.
3. **VoyageAI API key** for embeddings.

## Environment variables

Copy the template before running locally:

```bash
cp .env.example .env.local
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | ✅ | — | Atlas connection string (sample dataset loaded). |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ | — | Google Generative AI key for Gemini. |
| `VOYAGE_API_KEY` | ✅ | — | VoyageAI key for embeddings. |
| `MFLIX_DB_NAME` | ❌ | `sample_mflix` | Database holding the `movies` collection. |
| `MEMORY_DB_NAME` | ❌ | `personalised_mflix_memory` | Database for session and semantic memory. |
| `GEMINI_MODEL` | ❌ | `gemini-3.1-flash` | Gemini model identifier. |
| `VOYAGE_EMBEDDING_MODEL` | ❌ | `voyage-3.5` | Voyage embedding model. |

The optional variables fall back to their defaults if left blank, so a minimal deploy only needs the three secrets.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Architecture

- `app/page.tsx` renders the LeafyGreen-style product dashboard.
- `app/api/recommendations/route.ts` stores explicit preferences as semantic memory, retrieves related memory, queries `sample_mflix.movies`, and asks Gemini to summarize the recommendation set.
- `app/api/chat/route.ts` uses `ToolLoopAgent` with the documented hook-driven `loadSession` / `onFinish` memory pattern.
- `lib/memory.ts` configures `@mongodb-developer/vercel-ai-memory` with `voyage.textEmbeddingModel('voyage-3.5')` and a separate memory database.
- `lib/movies.ts` contains MongoDB query helpers and safe projections for movie cards.

## Database behavior

The application reads from the Atlas sample dataset and writes to `MEMORY_DB_NAME` only. The memory package creates TTL and Atlas Vector Search indexes for its own collections on first use. Vector Search indexes can take a few seconds to become queryable after initial creation.

## Notes

- The UI intentionally follows MongoDB LeafyGreen product design: light surfaces, evergreen actions, serif display headings, quiet borders, and concise sentence-case copy.
- If the exact Gemini model identifier changes in your Google account, update `GEMINI_MODEL` without changing application code.
