# AGENTS.md

Guidance for AI agents working in the **Personalised mflix** repository — a Next.js 16 app that recommends movies from MongoDB Atlas `sample_mflix` using the Vercel AI SDK (Gemini), VoyageAI embeddings, and MongoDB-backed memory.

## Build and test commands

```bash
npm install        # install dependencies
npm run dev        # start the dev server at http://localhost:3000
npm run build      # production build (Next.js)
npm run typecheck  # tsc --noEmit
```

There is no unit test suite; `npm run build` and `npm run typecheck` are the smoke checks. CI runs both on every push and pull request.

## Project structure

- `app/page.tsx` — LeafyGreen-style product dashboard (server component).
- `app/api/recommendations/route.ts` — POST endpoint that stores preferences as memory, retrieves related memory, queries movies, and summarizes with Gemini.
- `app/api/chat/route.ts` — streaming chat endpoint using `ToolLoopAgent` with the `loadSession` / `onFinish` memory pattern and a `searchMovies` tool.
- `lib/ai.ts` — Gemini model + VoyageAI embedding model factories.
- `lib/memory.ts` — configures `@mongodb-developer/vercel-ai-memory` (TTL + Atlas Vector Search).
- `lib/mongodb.ts` — cached `MongoClient` and `getMflixDb()` helper.
- `lib/movies.ts` — MongoDB query helpers and safe projections.
- `lib/recommendations.ts` — orchestrates memory + movie queries + Gemini summary.
- `lib/types.ts` — shared TypeScript types for movie documents and API payloads.
- `components/` — React UI (dashboard, chat panel, movie cards).

## Environment variables and configuration

Copy `.env.example` to `.env.local`. Required secrets: `MONGODB_URI`, `GOOGLE_GENERATIVE_AI_API_KEY`, `VOYAGE_API_KEY`. Optional with code defaults: `MFLIX_DB_NAME` (`sample_mflix`), `MEMORY_DB_NAME` (`personalised_mflix_memory`), `GEMINI_MODEL` (`gemini-3.1-flash`), `VOYAGE_EMBEDDING_MODEL` (`voyage-3.5`). See the README env table for details.

The app **reads** from the Atlas sample dataset and **writes** only to `MEMORY_DB_NAME`.

## MongoDB Skills

Use the official MongoDB agent skills from https://github.com/mongodb/agent-skills
whenever the task is MongoDB-specific and a matching skill exists.

## When To Use EDD.md

Use [EDD.md](./EDD.md) as the source of truth for the MongoDB data model in this repository.

Consult [EDD.md](./EDD.md) before making changes that touch:

- MongoDB collections, document structure, or field names
- API routes that read or write database records
- Validation, form fields, API payloads, or UI that depend on persisted data
- Schema documentation, Mermaid diagrams, or entity modeling discussions
