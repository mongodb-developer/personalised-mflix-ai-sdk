'use client'

import { FormEvent, useEffect, useState } from 'react'
import type { MovieCard as MovieCardType, RecommendationResponse } from '../lib/types'
import type { ViewerProfile } from './StreamingPlatform'
import { MovieCard } from './MovieCard'

const genres = ['Drama', 'Comedy', 'Crime', 'Thriller', 'Romance', 'Action', 'Sci-Fi', 'Documentary', 'Mystery', 'Horror']

export function RecommendationDashboard({
  initialMovies,
  genreRows,
  userId,
  sessionId,
  viewerLabel,
  profile,
}: {
  initialMovies: MovieCardType[]
  genreRows: Record<string, MovieCardType[]>
  userId: string
  sessionId: string
  viewerLabel: string
  profile: ViewerProfile
}) {
  const [movies, setMovies] = useState<MovieCardType[]>(initialMovies)
  const [summary, setSummary] = useState(
    `Suggested for ${viewerLabel}. Tune this viewer’s profile to update the personalised row using MongoDB memory.`,
  )
  const [memory, setMemory] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    void refreshFromProfile(profile)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function refreshFromProfile(nextProfile: ViewerProfile) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          genres: nextProfile.genres,
          mood: nextProfile.mood,
          language: nextProfile.language,
          minYear: nextProfile.minYear,
          minRating: nextProfile.minRating,
          avoid: nextProfile.avoid,
        }),
      })

      if (!response.ok) throw new Error(await response.text())

      const data = (await response.json()) as RecommendationResponse
      setMovies(data.recommendations)
      setSummary(data.summary)
      setMemory(data.memory)
    } catch (error) {
      setMovies(initialMovies)
      setSummary(error instanceof Error ? error.message : 'Unable to load recommendations.')
    } finally {
      setIsLoading(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const selectedGenres = form.getAll('genres').map(String)

    setIsLoading(true)

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          genres: selectedGenres,
          mood: String(form.get('mood') ?? ''),
          language: String(form.get('language') ?? ''),
          minYear: Number(form.get('minYear') || 1990),
          minRating: Number(form.get('minRating') || 7),
          avoid: String(form.get('avoid') ?? ''),
        }),
      })

      if (!response.ok) throw new Error(await response.text())

      const data = (await response.json()) as RecommendationResponse
      setMovies(data.recommendations)
      setSummary(data.summary)
      setMemory(data.memory)
    } catch (error) {
      setSummary(error instanceof Error ? error.message : 'Unable to load recommendations.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="recommendation-stage">
      <div className="suggested-header panel">
        <div>
          <div className="panel-kicker">Suggested for you</div>
          <h2>{viewerLabel}’s next watch</h2>
          <p className="muted">A personalised row built from this viewer’s explicit taste profile and MongoDB-backed semantic memory.</p>
        </div>
        <div className="viewer-pill">{userId}</div>
      </div>

      <form className="preferences preference-console panel" onSubmit={submit}>
        <div className="field field-wide">
          <label>Genres</label>
          <select name="genres" multiple defaultValue={profile.genres} size={5}>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Mood</label>
          <input name="mood" defaultValue={profile.mood} />
        </div>
        <div className="field">
          <label>Language</label>
          <input name="language" placeholder="English" defaultValue={profile.language} />
        </div>
        <div className="field">
          <label>Minimum year</label>
          <input name="minYear" type="number" defaultValue={profile.minYear} min={1900} max={2035} />
        </div>
        <div className="field">
          <label>Minimum IMDb</label>
          <input name="minRating" type="number" defaultValue={profile.minRating} min={0} max={10} step={0.1} />
        </div>
        <div className="field field-wide">
          <label>Avoid</label>
          <input name="avoid" placeholder="slapstick, horror, long runtime" defaultValue={profile.avoid} />
        </div>
        <div className="button-row profile-action">
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Generating' : 'Refresh recommendations'}
          </button>
        </div>
      </form>

      <div className="summary-card streaming-summary">
        <span className="summary-label">Curator note</span>
        {summary}
      </div>

      {memory.length > 0 ? (
        <ul className="memory-list">
          {memory.slice(0, 4).map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : null}

      {movies.length > 0 ? (
        <>
        <div className="rail-header">
          <div>
            <div className="panel-kicker">Because of your profile</div>
            <h3>Suggested for you</h3>
          </div>
          <span>{movies.length} titles</span>
        </div>
        <div className="movie-grid streaming-rail">
          {movies.map((movie) => (
            <MovieCard movie={movie} key={movie.id} />
          ))}
        </div>
        </>
      ) : (
        <div className="empty-state">No recommendations yet. Adjust the profile and run the recommender.</div>
      )}

      <section className="genre-discovery">
        <div className="rail-header genre-title">
          <div>
            <div className="panel-kicker">By genre</div>
            <h3>Search by mood, genre, and collection</h3>
          </div>
          <span>{Object.keys(genreRows).length} rails</span>
        </div>

        {Object.entries(genreRows).map(([genre, row]) => (
          <div className="genre-row" key={genre}>
            <div className="genre-row-heading">
              <h4>{genre}</h4>
              <span>{row.length} titles</span>
            </div>
            <div className="horizontal-rail">
              {row.map((movie) => (
                <MovieCard movie={movie} key={movie.id} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </section>
  )
}