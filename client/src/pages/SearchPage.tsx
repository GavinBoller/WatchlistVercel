import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TMDBMovie } from '@shared/schema';
import AddToWatchlistModal from '@/components/AddToWatchlistModal';

interface SearchPageProps {
  movie?: TMDBMovie;
}

export function SearchPage({ movie }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  const { data: searchResults, error } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3000/api/tmdb/search?query=${searchQuery}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: !!searchQuery,
  });

  const handleAddToWatchlist = (entry: {
    tmdbId: number;
    tmdbMovie: TMDBMovie;
    status: 'toWatch' | 'watched';
    notes?: string;
    platformId?: number;
  }) => {
    alert('Added to watchlist: ' + entry.tmdbMovie.title);
    setSelectedMovie(null);
  };

  return (
    <div className="space-y-4">
      <h1>Search Movies</h1>
      <Input
        placeholder="Search movies..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {error && <div>Error: {error.message}</div>}
      {searchResults?.results?.map((result: TMDBMovie) => (
        <div key={result.id}>
          <h3>{result.title || result.name}</h3>
          <Button onClick={() => setSelectedMovie(result)}>Add to Watchlist</Button>
        </div>
      ))}
      {selectedMovie && (
        <AddToWatchlistModal
          movie={selectedMovie}
          platforms={[]}
          isOpen={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onAdd={handleAddToWatchlist}
        />
      )}
      {movie && <div>Selected Movie: {movie.title || movie.name}</div>}
    </div>
  );
}
