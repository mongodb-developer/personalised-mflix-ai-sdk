import type { MovieCard as MovieCardType } from '../lib/types'

export function MovieCard({ movie }: { movie: MovieCardType }) {
  return (
    <article className="card movie-card">
      <div className="poster">
        {movie.poster ? <img src={movie.poster} alt="" /> : <span>{movie.title}</span>}
        <div className="poster-vignette" />
        {movie.imdbRating ? <div className="rating-chip">IMDb {movie.imdbRating}</div> : null}
      </div>
      <div className="movie-body">
        <h3 className="movie-title">{movie.title}</h3>
        <div className="muted">
          {[movie.year, movie.runtime ? `${movie.runtime} min` : undefined, movie.rated]
            .filter(Boolean)
            .join(' · ')}
        </div>
        <div className="badge-row">
          {movie.genres.slice(0, 3).map((genre) => (
            <span className="badge" key={genre}>
              {genre}
            </span>
          ))}
        </div>
        <p className="plot">{movie.plot.length > 190 ? `${movie.plot.slice(0, 190)}…` : movie.plot}</p>
        {movie.matchReason ? <div className="match-reason">{movie.matchReason}</div> : null}
      </div>
    </article>
  )
}