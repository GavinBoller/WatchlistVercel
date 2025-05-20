import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TMDBMovie, WatchlistEntryWithMovie, Platform } from '@shared/schema';
import { AlertCircle, CheckCircle, Clock, Film, Tv2, Menu, Inbox, PlayCircle, Search, X, RefreshCw, Plus } from 'lucide-react';

interface WatchlistPageProps {
  // Define props if needed
}

export default function WatchlistPage(props: WatchlistPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: watchlist, isLoading } = useQuery<WatchlistEntryWithMovie[]>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/auth/watchlist', {
        credentials: 'include',
      });
      return response.json();
    },
  });

  const { data: platformsData } = useQuery<Platform[]>({
    queryKey: ['platforms'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/auth/platforms', {
        credentials: 'include',
      });
      return response.json();
    },
  });

  const sortByRating = (a: WatchlistEntryWithMovie, b: WatchlistEntryWithMovie) => {
    const aRating = a.movie.voteAverage ?? 0;
    const bRating = b.movie.voteAverage ?? 0;
    return bRating - aRating;
  };

  const handleAddToWatchlist = (movie: TMDBMovie) => {
    setIsModalOpen(true);
  };

  const processedWatchlist = watchlist?.map((entry) => ({
    ...entry,
    movie: {
      ...entry.movie,
      voteAverage: entry.movie.voteAverage ?? 0,
    },
  })).sort(sortByRating);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h1>Watchlist</h1>
      {processedWatchlist?.map((entry) => (
        <div key={entry.id} className="flex items-center space-x-4">
          <img
            src={entry.movie.posterPath}
            alt={entry.movie.title}
            className="w-20 h-30 rounded"
          />
          <div>
            <h3>{entry.movie.title}</h3>
            <p>{entry.movie.overview}</p>
            <p>Status: {entry.status}</p>
            <p>Rating: {entry.movie.voteAverage}</p>
            {entry.platformId && platformsData && (
              <p>
                Platform: {platformsData.find((p) => p.id === entry.platformId)?.name}
                {platformsData.find((p) => p.id === entry.platformId)?.isDefault && ' (Default)'}
              </p>
            )}
          </div>
        </div>
      ))}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Watchlist</DialogTitle>
          </DialogHeader>
          <div>Form placeholder</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
