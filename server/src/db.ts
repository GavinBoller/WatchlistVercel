import { UserResponse, InsertUser, WatchlistEntry } from '@shared/schema';

export async function getUserByUsername(username: string): Promise<UserResponse | null> {
  if (username === 'TestUser') {
    return { id: 1, username, displayName: 'Test User', role: 'user', createdAt: new Date().toISOString() };
  }
  return null;
}

export async function createUser({ username, password, displayName }: InsertUser): Promise<UserResponse> {
  return { id: 2, username, displayName, role: 'user', createdAt: new Date().toISOString() };
}

export async function getWatchlist(userId: number): Promise<WatchlistEntry[]> {
  return [];
}

export async function addToWatchlist(userId: number, tmdbId: number): Promise<WatchlistEntry> {
  return { id: 1, userId, tmdbId, status: 'toWatch', createdAt: new Date().toISOString(), movie: { tmdbId, title: 'Mock Movie', posterPath: '', mediaType: 'movie', overview: '', releaseDate: '', voteAverage: 0, backdropPath: '', genres: '' } };
}
