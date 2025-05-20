import { TMDBMovie } from '@shared/schema';
import { getImageUrl } from '@/api/tmdb';

interface MovieCardProps {
  movie: TMDBMovie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  let posterUrl = getImageUrl(movie.poster_path ?? null);

  return (
    <div className="space-y-2">
      {posterUrl && <img src={posterUrl} alt={movie.title || movie.name} />}
      <h3>{movie.title || movie.name}</h3>
      <p>{movie.overview}</p>
    </div>
  );
}
