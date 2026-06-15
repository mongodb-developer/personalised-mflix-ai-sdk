import type { Filter } from 'mongodb'
import { getMflixDb } from './mongodb'
import type { MovieCard, MovieDocument, PreferenceInput } from './types'

const movieProjection = {
  title: 1,
  plot: 1,
  fullplot: 1,
  genres: 1,
  cast: 1,
  directors: 1,
  countries: 1,
  languages: 1,
  year: 1,
  runtime: 1,
  rated: 1,
  poster: 1,
  imdb: 1,
  tomatoes: 1,
}

export function toMovieCard(movie: MovieDocument): MovieCard {
  return {
    id: movie._id.toString(),
    title: movie.title,
    plot: movie.fullplot ?? movie.plot ?? 'No plot summary is available.',
    genres: movie.genres ?? [],
    cast: (movie.cast ?? []).slice(0, 4),
    directors: movie.directors ?? [],
    year: movie.year,
    runtime: movie.runtime,
    rated: movie.rated,
    poster: movie.poster,
    imdbRating: movie.imdb?.rating,
    tomatoesRating: movie.tomatoes?.viewer?.rating,
  }
}

export function buildMovieFilter(input: Partial<PreferenceInput>, memoryStatements: string[] = []): Filter<MovieDocument> {
  const filter: Filter<MovieDocument> = {
    title: { $exists: true, $type: 'string' },
    plot: { $exists: true, $type: 'string' },
  }

  const genres = new Set(input.genres?.filter(Boolean))
  for (const memory of memoryStatements) {
    for (const genre of ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western']) {
      if (memory.toLowerCase().includes(genre.toLowerCase())) {
        genres.add(genre)
      }
    }
  }

  if (genres.size > 0) {
    filter.genres = { $in: [...genres] }
  }

  if (input.language) {
    filter.languages = input.language
  }

  const yearRange: Record<string, number> = {}
  if (input.minYear) yearRange.$gte = input.minYear
  if (input.maxYear) yearRange.$lte = input.maxYear
  if (Object.keys(yearRange).length > 0) filter.year = yearRange

  if (input.minRating) {
    filter['imdb.rating'] = { $gte: input.minRating }
  }

  if (input.avoid) {
    filter.$and = [
      { title: { $not: new RegExp(input.avoid, 'i') } },
      { plot: { $not: new RegExp(input.avoid, 'i') } },
      { genres: { $not: new RegExp(input.avoid, 'i') } },
    ]
  }

  return filter
}

export async function findMovies(input: Partial<PreferenceInput>, memoryStatements: string[] = [], limit = 12): Promise<MovieCard[]> {
  const db = await getMflixDb()
  const filter = buildMovieFilter(input, memoryStatements)

  const movies = await db
    .collection<MovieDocument>('movies')
    .find(filter, { projection: movieProjection })
    .sort({ 'imdb.rating': -1, 'imdb.votes': -1, year: -1 })
    .limit(limit)
    .toArray()

  return movies.map(toMovieCard)
}

export async function searchMovies(query: string, limit = 8): Promise<MovieCard[]> {
  const db = await getMflixDb()
  const safeQuery = query.trim().slice(0, 120)
  const regex = new RegExp(safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

  const movies = await db
    .collection<MovieDocument>('movies')
    .find(
      {
        $or: [{ title: regex }, { plot: regex }, { fullplot: regex }, { genres: regex }, { cast: regex }, { directors: regex }],
      },
      { projection: movieProjection },
    )
    .sort({ 'imdb.rating': -1, 'imdb.votes': -1 })
    .limit(limit)
    .toArray()

  return movies.map(toMovieCard)
}

export async function getFeaturedMovies(): Promise<MovieCard[]> {
  const db = await getMflixDb()
  const movies = await db
    .collection<MovieDocument>('movies')
    .find(
      {
        poster: { $exists: true, $type: 'string' },
        'imdb.rating': { $gte: 7.8 },
        year: { $gte: 1990 },
      },
      { projection: movieProjection },
    )
    .sort({ 'imdb.rating': -1, 'imdb.votes': -1 })
    .limit(9)
    .toArray()

  return movies.map(toMovieCard)
}

export async function getGenreRows(genres = ['Drama', 'Crime', 'Comedy', 'Sci-Fi', 'Thriller']): Promise<Record<string, MovieCard[]>> {
  const db = await getMflixDb()
  const entries = await Promise.all(
    genres.map(async (genre) => {
      const movies = await db
        .collection<MovieDocument>('movies')
        .find(
          {
            genres: genre,
            poster: { $exists: true, $type: 'string' },
            'imdb.rating': { $gte: 6.8 },
          },
          { projection: movieProjection },
        )
        .sort({ 'imdb.rating': -1, 'imdb.votes': -1 })
        .limit(8)
        .toArray()

      return [genre, movies.map(toMovieCard)] as const
    }),
  )

  return Object.fromEntries(entries)
}