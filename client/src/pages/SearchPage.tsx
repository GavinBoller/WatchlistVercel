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

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3000/api/tmdb/search?query=${searchQuery}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: !!searchQuery,
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search movies..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
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
          onAdd={() => setSelectedMovie(null)}
        />
      )}
      {movie && <div>Selected Movie: {movie.title || movie.name}</div>}
    </div>
  );
}
