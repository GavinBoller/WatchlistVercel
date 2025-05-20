export interface UserResponse {
  id: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type?: 'movie' | 'tv';
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  backdrop_path?: string;
  genre_ids?: number[] | string;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

export interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string;
  mediaType: 'movie' | 'tv';
  overview: string;
  releaseDate: string;
  voteAverage: number;
  backdropPath: string;
  genres: string;
}

export interface WatchlistEntry {
  id: number;
  userId: number;
  tmdbId: number;
  platformId?: number;
  watchedDate?: string;
  notes?: string;
  status: 'toWatch' | 'watched';
  createdAt: string;
  movie: Movie;
}

export interface Platform {
  id: number;
  name: string;
  icon: string;
}
