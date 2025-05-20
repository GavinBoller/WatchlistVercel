export interface UserResponse {
  id: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export interface InsertUser {
  username: string;
  displayName: string;
  password: string;
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
  runtime?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
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

export interface WatchlistEntryWithMovie extends WatchlistEntry {
  movie: Movie;
}

export interface Platform {
  id: number;
  name: string;
  icon: string;
  logoUrl?: string;
  isDefault?: boolean;
}

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type: 'movie' | 'tv';
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  backdrop_path?: string;
  genre_ids?: number[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_results: number;
  total_pages: number;
}
