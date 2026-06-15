import type { ObjectId } from 'mongodb'

export type MovieDocument = {
  _id: ObjectId
  title: string
  fullplot?: string
  plot?: string
  genres?: string[]
  cast?: string[]
  directors?: string[]
  countries?: string[]
  languages?: string[]
  year?: number
  runtime?: number
  rated?: string
  poster?: string
  imdb?: {
    rating?: number
    votes?: number
    id?: number
  }
  tomatoes?: {
    viewer?: { rating?: number; numReviews?: number }
    critic?: { rating?: number; numReviews?: number }
    fresh?: number
    rotten?: number
  }
}

export type MovieCard = {
  id: string
  title: string
  plot: string
  genres: string[]
  cast: string[]
  directors: string[]
  year?: number
  runtime?: number
  rated?: string
  poster?: string
  imdbRating?: number
  tomatoesRating?: number
  matchReason?: string
}

export type PreferenceInput = {
  userId: string
  sessionId?: string
  genres?: string[]
  mood?: string
  language?: string
  minYear?: number
  maxYear?: number
  minRating?: number
  avoid?: string
}

export type RecommendationResponse = {
  recommendations: MovieCard[]
  memory: string[]
  summary: string
}