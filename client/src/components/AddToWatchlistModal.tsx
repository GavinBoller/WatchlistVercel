import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { TMDBMovie } from '@shared/schema';
import { useJwtAuth } from '@/hooks/use-jwt-auth';

interface AddToWatchlistModalProps {
  movie: TMDBMovie;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({ movie, isOpen, onClose }) => {
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'toWatch' | 'watched'>('toWatch');
  const { toast } = useToast();
  const { user } = useJwtAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to add to your watchlist',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tmdbId: movie.id,
          tmdbMovie: {
            id: movie.id,
            title: movie.title || movie.name,
            poster_path: movie.poster_path,
            media_type: movie.media_type,
            overview: movie.overview,
            release_date: movie.release_date || movie.first_air_date,
            vote_average: movie.vote_average,
            backdrop_path: movie.backdrop_path,
            genres: movie.genre_ids ? movie.genre_ids.join(',') : '',
          },
          status,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to watchlist');
      }

      toast({
        title: 'Added to watchlist',
        description: `${movie.title || movie.name} has been added to your watchlist.`,
      });
      onClose();
    } catch (error) {
      console.error('[AddToWatchlist] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add to watchlist. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#292929] text-white border-gray-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="movie-title">Movie</Label>
            <Input
              id="movie-title"
              value={movie.title || movie.name || 'Unknown'}
              disabled
              className="bg-gray-800 text-white border-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'toWatch' | 'watched')}
              className="w-full bg-gray-800 text-white border-gray-700 rounded-md p-2"
            >
              <option value="toWatch">To Watch</option>
              <option value="watched">Watched</option>
            </select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              className="bg-gray-800 text-white border-gray-700"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#E50914] hover:bg-red-700">
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
