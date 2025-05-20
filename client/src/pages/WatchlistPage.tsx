import { useQuery } from '@tanstack/react-query';
import WatchlistEntry from '@/components/WatchlistEntry';
import { WatchlistEntryWithMovie } from '@shared/schema';

export default function WatchlistPage() {
  const { data: watchlist } = useQuery<WatchlistEntryWithMovie[]>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/auth/watchlist', {
        credentials: 'include',
      });
      return response.json();
    },
  });

  const handleEdit = (entry: WatchlistEntryWithMovie) => {
    console.log('Edit:', entry);
  };

  const handleDelete = (id: number) => {
    console.log('Delete:', id);
  };

  const handleViewDetails = (entry: WatchlistEntryWithMovie) => {
    console.log('View Details:', entry);
  };

  return (
    <div>
      <h1>Watchlist</h1>
      {watchlist?.map((entry) => (
        <WatchlistEntry
          key={entry.id}
          entry={entry}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
      ))}
    </div>
  );
}
