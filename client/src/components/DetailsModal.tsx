import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TMDBMovie } from '@shared/schema';
import { getImageUrl } from '@/api/tmdb';

interface DetailsModalProps {
  item: TMDBMovie;
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailsModal({ item, isOpen, onClose }: DetailsModalProps) {
  const posterUrl = getImageUrl(item.poster_path ?? null);
  const backdropUrl = getImageUrl(item.backdrop_path ?? null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.title || item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {backdropUrl && <img src={backdropUrl} alt="Backdrop" />}
          {posterUrl && <img src={posterUrl} alt="Poster" />}
          <p>{item.overview}</p>
          <p>Release Date: {item.release_date}</p>
          <p>Rating: {item.vote_average}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
