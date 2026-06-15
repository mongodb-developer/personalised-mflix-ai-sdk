'use client'

import { FormEvent, useMemo, useState } from 'react'
import type { MovieCard } from '../lib/types'
import { ChatPanel } from './ChatPanel'
import { RecommendationDashboard } from './RecommendationDashboard'

type Viewer = {
  id: string
  label: string
  taste: string
  profile: ViewerProfile
}

export type ViewerProfile = {
  genres: string[]
  mood: string
  language: string
  minYear: number
  minRating: number
  avoid: string
}

const viewers: Viewer[] = [
  {
    id: 'demo-user',
    label: 'Pavel',
    taste: 'Crime dramas · strong reviews',
    profile: { genres: ['Drama', 'Crime'], mood: 'tense and thoughtful', language: '', minYear: 1990, minRating: 7, avoid: 'slapstick' },
  },
  {
    id: 'maya',
    label: 'Maya',
    taste: 'Romance · international cinema',
    profile: { genres: ['Romance', 'Drama'], mood: 'emotional and character-driven', language: 'French', minYear: 1980, minRating: 6.8, avoid: 'horror' },
  },
  {
    id: 'atlas-team',
    label: 'Atlas team',
    taste: 'Sci-Fi · documentaries',
    profile: { genres: ['Sci-Fi', 'Documentary'], mood: 'clever and expansive', language: '', minYear: 2000, minRating: 7.2, avoid: 'romantic comedy' },
  },
]

export function StreamingPlatform({ initialMovies, genreRows }: { initialMovies: MovieCard[]; genreRows: Record<string, MovieCard[]> }) {
  const [availableViewers, setAvailableViewers] = useState(viewers)
  const [viewerId, setViewerId] = useState(viewers[0].id)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const viewer = useMemo(() => availableViewers.find((item) => item.id === viewerId) ?? availableViewers[0], [availableViewers, viewerId])
  const sessionId = `${viewer.id}-main-session`

  function createViewer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const label = String(form.get('name') || 'New viewer').trim()
    const genres = String(form.get('genres') || 'Drama')
      .split(',')
      .map((genre) => genre.trim())
      .filter(Boolean)
    const profile: ViewerProfile = {
      genres,
      mood: String(form.get('mood') || 'surprising and well reviewed'),
      language: String(form.get('language') || ''),
      minYear: Number(form.get('minYear') || 1990),
      minRating: Number(form.get('minRating') || 7),
      avoid: String(form.get('avoid') || ''),
    }
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `viewer-${Date.now()}`
    const nextViewer = { id, label, taste: `${profile.genres.join(', ')} · ${profile.mood}`, profile }

    setAvailableViewers((current) => [...current.filter((item) => item.id !== id), nextViewer])
    setViewerId(id)
    setShowOnboarding(false)
  }

  return (
    <>
      {showOnboarding ? (
        <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
          <div className="onboarding-modal">
            <div className="panel-kicker">Choose viewer</div>
            <h2 id="onboarding-title">Start with a taste profile.</h2>
            <p className="muted">Pick an existing viewer or create a new one. The first recommendation row updates immediately from that profile.</p>

            <div className="viewer-choice-grid">
              {availableViewers.map((item) => (
                <button
                  className={item.id === viewerId ? 'viewer-choice active' : 'viewer-choice'}
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setViewerId(item.id)
                    setShowOnboarding(false)
                  }}
                >
                  <strong>{item.label}</strong>
                  <span>{item.taste}</span>
                </button>
              ))}
            </div>

            <form className="new-viewer-form" onSubmit={createViewer}>
              <div className="panel-kicker">Onboard new viewer</div>
              <div className="field"><label>Name</label><input name="name" placeholder="Dana" /></div>
              <div className="field"><label>Genres</label><input name="genres" placeholder="Thriller, Mystery" /></div>
              <div className="field"><label>Mood</label><input name="mood" placeholder="dark, clever, fast-paced" /></div>
              <div className="field"><label>Language</label><input name="language" placeholder="English" /></div>
              <div className="field"><label>Minimum year</label><input name="minYear" type="number" defaultValue={1990} /></div>
              <div className="field"><label>Minimum IMDb</label><input name="minRating" type="number" defaultValue={7} step={0.1} /></div>
              <div className="field field-wide"><label>Avoid</label><input name="avoid" placeholder="horror, slapstick" /></div>
              <button className="primary-button" type="submit">Create and start</button>
            </form>
          </div>
        </div>
      ) : null}

      <section className="streaming-layout" id="recommendations">
        <div className="left-curator" id="curator">
          <div className="viewer-switcher panel">
            <div className="panel-kicker">Viewer profile</div>
            <label htmlFor="viewer">Switch viewer</label>
            <select id="viewer" value={viewerId} onChange={(event) => setViewerId(event.target.value)}>
              {availableViewers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <p>{viewer.taste}</p>
            <button className="secondary-button profile-button" type="button" onClick={() => setShowOnboarding(true)}>
              Manage profile
            </button>
          </div>
          <ChatPanel key={viewer.id} userId={viewer.id} sessionId={sessionId} viewerLabel={viewer.label} profile={viewer.profile} />
        </div>

        <RecommendationDashboard key={viewer.id} initialMovies={initialMovies} genreRows={genreRows} userId={viewer.id} sessionId={sessionId} viewerLabel={viewer.label} profile={viewer.profile} />
      </section>
    </>
  )
}