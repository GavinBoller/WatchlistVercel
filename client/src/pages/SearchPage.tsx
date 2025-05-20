import React, { Component, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Film, Tv2, Menu } from 'lucide-react';
import { TMDBMovie } from '@shared/schema';
import MovieCard from '@/components/MovieCard';
import { AddToWatchlistModal } from '@/components/AddToWatchlistModal';
import { DetailsModal } from '@/components/DetailsModal';
import { useJwtAuth } from '@/hooks/use-jwt-auth';
import { useToast } from '@/hooks/use-toast';

type MediaFilterType = 'all' | 'movie' | 'tv';

// Mock searchMovies function (replace with TMDB API)
const searchMovies = async (query: string, mediaFilter: MediaFilterType): Promise<{ page: number; results: TMDBMovie[]; total_results: number; total_pages: number }> => {
  if (!query) return { page: 1, results: [], total_results: 0, total_pages: 0 };
  const mockResults: TMDBMovie[] = [
    {
      id: 550,
      title: 'Fight Club',
      poster_path: '/path.jpg',
      media_type: 'movie',
      overview: 'A ticking-time-bomb insomniac...',
      release_date: '1999-10-15',
      vote_average: 8.4,
      backdrop_path: '/backdrop.jpg',
      genre_ids: [18, 53], // Drama, Thriller
      runtime: 139,
    },
    {
      id: 680,
      title: 'Pulp Fiction',
      poster_path: '/pulp.jpg',
      media_type: 'movie',
      overview: 'The lives of two mob hitmen...',
      release_date: '1994-10-14',
      vote_average: 8.5,
      backdrop_path: '/pulp-backdrop.jpg',
      genre_ids: [80, 18], // Crime, Drama
      runtime: 154,
    },
    {
      id: 714,
      name: 'Breaking Bad',
      poster_path: '/breakingbad.jpg',
      media_type: 'tv',
      overview: 'A chemistry teacher turned drug lord...',
      first_air_date: '2008-01-20',
      vote_average: 8.9,
      backdrop_path: '/breakingbad-backdrop.jpg',
      genre_ids: [18, 80], // Drama, Crime
      number_of_seasons: 5,
      number_of_episodes: 62,
    },
  ];
  return {
    page: 1,
    results: mockResults.filter((m) => (m.title || m.name || '').toLowerCase().includes(query.toLowerCase()) && (mediaFilter === 'all' || m.media_type === mediaFilter)),
    total_results: mockResults.length,
    total_pages: 1,
  };
};

interface SearchPageState {
  hasError: boolean;
}

interface SearchPageProps {
  movie?: TMDBMovie;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, SearchPageState> {
  state: SearchPageState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}

export default function SearchPage({ movie }: SearchPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilterType>('all');
  const [selectedItem, setSelectedItem] = useState<TMDBMovie | null>(null);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { isAuthenticated } = useJwtAuth();
  const { toast } = useToast();

  // Mock movie data if none provided
  const defaultMovie: TMDBMovie = movie || {
    id: 0,
    title: 'Unknown Movie',
    poster_path: '/unknown.jpg',
    media_type: 'movie',
    overview: 'No description available',
    release_date: 'N/A',
    vote_average: 0,
    backdrop_path: '/unknown.jpg',
    genre_ids: [],
  };

  // Search query
  const { data: searchResults, isLoading, error: searchError } = useQuery({
    queryKey: ['/api/movies/search', searchQuery, mediaFilter],
    queryFn: () => searchMovies(searchQuery, mediaFilter),
    enabled: !!searchQuery,
    retry: 1,
  });

  // Filter results
  const filteredResults = searchResults?.results?.filter((item) => {
    if (!item || typeof item !== 'object') {
      console.warn('Invalid item in search results:', item);
      return false;
    }
    if (!item.id || (!item.title && !item.name)) {
      console.warn('Item missing required fields:', item);
      return false;
    }
    if (mediaFilter === 'all') return true;
    return item.media_type === mediaFilter;
  }) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchQuery(searchTerm.trim());
    }
  };

  const handleAddToWatchlist = (item: TMDBMovie) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to add to your watchlist',
        variant: 'destructive',
      });
      return;
    }
    setSelectedItem(item);
    setIsWatchlistModalOpen(true);
  };

  const handleShowDetails = (item: TMDBMovie) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
  };

  const mediaTypeFilters = [
    { value: 'all', label: 'All', icon: Menu },
    { value: 'movie', label: 'Movies', icon: Film },
    { value: 'tv', label: 'TV Shows', icon: Tv2 },
  ];

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        {/* Introduction Text */}
        <div className="max-w-2xl mx-auto text-center mt-6 mb-6">
          <h2 className="text-lg sm:text-xl font-bold">
            Search for movies and TV shows to get started
          </h2>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-4">
          <form className="relative" onSubmit={handleSearch}>
            <Input
              type="text"
              placeholder="Search for movies or TV shows..."
              className="w-full bg-[#292929] text-white border border-gray-700 rounded-lg py-3 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#E50914]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Button
              type="submit"
              className="absolute inset-y-0 right-0 flex items-center px-4 text-white bg-[#E50914] rounded-r-lg hover:bg-red-700 focus:outline-none"
            >
              <span className="hidden sm:inline">Search</span>
              <Search className="h-5 w-5 sm:hidden" />
            </Button>
          </form>
        </div>

        {/* Desktop Media Type Filter */}
        <div className="hidden md:flex justify-center mb-6">
          <div className="inline-flex items-center rounded-lg bg-[#292929] p-1">
            {mediaTypeFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.value}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition ${
                    mediaFilter === filter.value
                      ? 'bg-[#E50914] text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  onClick={() => setMediaFilter(filter.value as MediaFilterType)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Media Type Filter */}
        <div className="md:hidden mb-4">
          <div className="grid grid-cols-3 gap-1 bg-[#292929] rounded-lg p-1 shadow-inner">
            {mediaTypeFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.value}
                  className={`flex items-center justify-center px-2 py-2.5 rounded-md text-sm transition ${
                    mediaFilter === filter.value
                      ? 'bg-[#3d3d3d] text-white font-medium shadow-sm'
                      : 'text-gray-300 hover:bg-[#3d3d3d]/50'
                  }`}
                  onClick={() => setMediaFilter(filter.value as MediaFilterType)}
                >
                  <Icon className={`h-4 w-4 mr-1.5 ${mediaFilter === filter.value ? 'text-[#E50914]' : ''}`} />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Results */}
        <div className="mt-4">
          <h2 className={`text-lg sm:text-xl font-bold mb-4 ${searchQuery ? '' : 'hidden'}`}>
            {searchQuery && `${filteredResults?.length || 0} Results for "${searchQuery}"`}
          </h2>

          {searchError ? (
            <div className="text-center py-10 text-gray-400 flex flex-col items-center">
              <div className="bg-red-900/30 rounded-lg p-4 max-w-md mx-auto mb-4">
                <p className="text-white font-medium mb-2">Error loading search results</p>
                <p className="text-sm text-gray-300">Please try again or try a different search term.</p>
              </div>
              <Button
                variant="outline"
                className="mt-2 bg-[#1a1a1a] hover:bg-[#3d3d3d] border-gray-700"
                onClick={() => {
                  if (searchTerm) {
                    setSearchQuery(searchTerm);
                  }
                }}
              >
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  <Skeleton className="w-full aspect-[2/3]" />
                </div>
              ))}
            </div>
          ) : filteredResults && filteredResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredResults.map((item) => (
                <MovieCard
                  key={item.id}
                  movie={item}
                  onAddToWatchlist={handleAddToWatchlist}
                  onShowDetails={handleShowDetails}
                />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-10 text-gray-400 flex flex-col items-center">
              <Search className="h-10 w-10 mb-3 text-gray-600" />
              <p>
                {mediaFilter === 'all'
                  ? `No results found for "${searchQuery}"`
                  : `No ${mediaFilter === 'movie' ? 'movies' : 'TV shows'} found for "${searchQuery}"`}
              </p>
              <p className="text-sm mt-2 max-w-md">Try different keywords or check your spelling</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="max-w-md mx-auto bg-[#292929] rounded-lg p-4">
                <Film className="h-8 w-8 mx-auto mb-3 text-[#E50914]" />
                <p className="text-gray-300 mb-4">Enter a movie or TV show title in the search box to begin exploring</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Button
                    variant="outline"
                    className="bg-[#1a1a1a] hover:bg-[#3d3d3d] border-gray-700"
                    onClick={() => {
                      setSearchTerm('Marvel');
                      setSearchQuery('Marvel');
                    }}
                  >
                    Try "Marvel"
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-[#1a1a1a] hover:bg-[#3d3d3d] border-gray-700"
                    onClick={() => {
                      setSearchTerm('Star Wars');
                      setSearchQuery('Star Wars');
                    }}
                  >
                    Try "Star Wars"
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-[#1a1a1a] hover:bg-[#3d3d3d] border-gray-700"
                    onClick={() => {
                      setSearchTerm('Breaking Bad');
                      setSearchQuery('Breaking Bad');
                    }}
                  >
                    Try "Breaking Bad"
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-[#1a1a1a] hover:bg-[#3d3d3d] border-gray-700"
                    onClick={() => {
                      setSearchTerm('Stranger Things');
                      setSearchQuery('Stranger Things');
                    }}
                  >
                    Try "Stranger Things"
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <AddToWatchlistModal
          movie={selectedItem || defaultMovie}
          isOpen={isWatchlistModalOpen}
          onClose={() => setIsWatchlistModalOpen(false)}
        />
        <DetailsModal
          item={selectedItem}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          showAddToWatchlistButton={true}
          onAddToWatchlist={handleAddToWatchlist}
        />
      </div>
    </ErrorBoundary>
  );
}
