import { useState, useEffect } from 'react';
import { WatchlistEntryWithMovie } from '@shared/schema';
import { Star, Trash2, Edit, Info, Calendar, Tv2, Film, ExternalLink, Monitor } from 'lucide-react';
import { getImageUrl, getIMDbUrl, getMovieDetails, formatRuntime } from '@/api/tmdb';

interface WatchlistEntryProps {
  entry: WatchlistEntryWithMovie;
  onEdit: (entry: WatchlistEntryWithMovie) => void;
  onDelete: (id: number) => void;
  onViewDetails: (entry: WatchlistEntryWithMovie) => void;
}

export default function WatchlistEntry({ entry, onEdit, onDelete, onViewDetails }: WatchlistEntryProps) {
  const { movie, watchedDate, id, notes, platformId } = entry;
  const [runtime, setRuntime] = useState<string>('');
  const [tvInfo, setTvInfo] = useState<string>('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const details = await getMovieDetails(movie.tmdbId, movie.mediaType);
        if (details.runtime) {
          setRuntime(formatRuntime(details.runtime));
        }
        if (details.numberOfSeasons && details.numberOfEpisodes) {
          const seasonText = details.numberOfSeasons === 1 ? 'season' : 'seasons';
          const episodeText = details.numberOfEpisodes === 1 ? 'episode' : 'episodes';
          setTvInfo(`${details.numberOfSeasons} ${seasonText}, ${details.numberOfEpisodes} ${episodeText}`);
        }
      } catch (error) {
        console.error('Failed to fetch movie details:', error);
      }
    };
    fetchDetails();
  }, [movie.tmdbId, movie.mediaType]);

  return (
    <div className="flex items-center space-x-4 border-b py-4">
      <img
        src={getImageUrl(movie.posterPath ?? null)}
        alt={movie.title}
        className="w-20 h-30 rounded"
      />
      <div className="flex-1">
        <h3>{movie.title}</h3>
        <p>{movie.overview}</p>
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4" />
          <span>{movie.voteAverage}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>{movie.releaseDate}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Tv2 className="h-4 w-4" />
          <span>{movie.mediaType}</span>
        </div>
        {runtime && (
          <div className="flex items-center space-x-2">
            <Film className="h-4 w-4" />
            <span>{runtime}</span>
          </div>
        )}
        {tvInfo && (
          <div className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>{tvInfo}</span>
          </div>
        )}
        <p>Status: {entry.status}</p>
        {notes && <p>Notes: {notes}</p>}
        {platformId && (
          <p>Platform ID: {platformId}</p>
        )}
        <a
          href={getIMDbUrl(movie.tmdbId) as unknown as string}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <div className="flex space-x-2">
        <button onClick={() => onEdit(entry)}>
          <Edit className="h-4 w-4" />
        </button>
        <button onClick={() => onDelete(id)}>
          <Trash2 className="h-4 w-4" />
        </button>
        <button onClick={() => onViewDetails(entry)}>
          <Info className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
