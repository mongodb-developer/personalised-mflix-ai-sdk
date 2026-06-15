import { StreamingPlatform } from '../components/StreamingPlatform'
import { getFeaturedMovies, getGenreRows } from '../lib/movies'
import type { MovieCard } from '../lib/types'

export const dynamic = 'force-dynamic'

const fallbackMovies: MovieCard[] = [
  {
    id: 'fallback-1',
    title: 'Connect MongoDB Atlas to begin',
    plot: 'Add MONGODB_URI and load the sample_mflix dataset to replace this setup card with live movie recommendations.',
    genres: ['Setup'],
    cast: [],
    directors: [],
    matchReason: 'Waiting for sample_mflix.movies.',
  },
]

export default async function Home() {
  const featuredMovies = await loadFeaturedMovies()
  const genreRows = await loadGenreRows()

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <div className="brand-lockup">
          <img src="/leafygreen/mongodb-leaf.svg" alt="MongoDB" />
          <span>Personalised mflix</span>
        </div>
        <div className="streaming-nav-links">
          <span>Home</span>
          <span>Series</span>
          <span>Films</span>
          <span>My memory</span>
        </div>
        <div className="nav-meta">sample_mflix · Gemini Flash 3.1 · VoyageAI</div>
      </nav>

      <div className="page">
        <section className="hero">
          <div className="hero-card">
            <p className="eyebrow">Now streaming from MongoDB</p>
            <h1>Your private cinema, tuned by memory.</h1>
            <p className="hero-copy">
              Browse a cinematic discovery surface powered by the Atlas sample movie dataset. Gemini curates the story,
              VoyageAI embeds your taste, and MongoDB memory keeps every preference ready for the next watch session.
            </p>
            <div className="hero-actions">
              <a className="primary-button hero-button" href="#recommendations">Start watching</a>
              <a className="secondary-button hero-button inverse" href="#curator">Ask curator</a>
            </div>
            <div className="metrics-grid">
              <div className="metric">
                <strong>23k+</strong>
                <span>sample movie documents</span>
              </div>
              <div className="metric">
                <strong>5</strong>
                <span>memory tiers available</span>
              </div>
              <div className="metric">
                <strong>1024</strong>
                <span>Voyage 3.5 default dimensions</span>
              </div>
            </div>
          </div>

          <div className="panel spotlight-panel">
            <div className="panel-kicker">Taste graph</div>
            <h2>Memory makes the rows personal.</h2>
            <p className="muted">
              The app reads from <code>sample_mflix.movies</code> and writes only to a separate memory database. The
              recommender stores explicit profile choices as semantic memory, retrieves nearby preferences, then queries
              movie metadata for grounded results.
            </p>
            <ul className="memory-list">
              <li>Gemini Flash 3.1 generates explanations and chat responses.</li>
              <li>VoyageAI 3.5 embeds semantic, episodic, and procedural memory.</li>
              <li>Session memory uses the documented hook-driven pattern.</li>
              <li>LeafyGreen styling keeps the surface Atlas-like and production-oriented.</li>
            </ul>
          </div>
        </section>

        <StreamingPlatform initialMovies={featuredMovies} genreRows={genreRows} />
      </div>
    </main>
  )
}

async function loadFeaturedMovies() {
  try {
    return await getFeaturedMovies()
  } catch (error) {
    console.warn('Unable to load featured movies:', error)
    return fallbackMovies
  }
}

async function loadGenreRows() {
  try {
    return await getGenreRows()
  } catch (error) {
    console.warn('Unable to load genre rows:', error)
    return { Setup: fallbackMovies }
  }
}