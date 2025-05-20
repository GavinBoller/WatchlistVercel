import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TMDBMovie, Platform } from '@shared/schema';

interface AddToWatchlistModalProps {
  movie: TMDBMovie;
  platforms: Platform[];
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: {
    tmdbId: number;
    tmdbMovie: TMDBMovie;
    status: 'toWatch' | 'watched';
    notes?: string;
    platformId?: number;
  }) => void;
}

export default function AddToWatchlistModal({
  movie,
  platforms,
  isOpen,
  onClose,
  onAdd,
}: AddToWatchlistModalProps) {
  const [status, setStatus] = useState<'toWatch' | 'watched'>('toWatch');
  const [notes, setNotes] = useState('');
  const [platformId, setPlatformId] = useState<number | undefined>(undefined);

  const handleSubmit = () => {
    onAdd({
      tmdbId: movie.id,
      tmdbMovie: {
        ...movie,
        genres: Array.isArray(movie.genre_ids) ? movie.genre_ids.join(',') : '',
      },
      status,
      notes,
      platformId,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {movie.title || movie.name} to Watchlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={status} onValueChange={(value: 'toWatch' | 'watched') => setStatus(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toWatch">To Watch</SelectItem>
              <SelectItem value="watched">Watched</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={platformId?.toString()}
            onValueChange={(value) => setPlatformId(value ? parseInt(value) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id.toString()}>
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Add notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add to Watchlist</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
