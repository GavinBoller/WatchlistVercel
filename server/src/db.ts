import { InsertUser, UserResponse, WatchlistEntry } from './shared/schema';

export interface User {
  id: number;
  username: string;
  displayName: string;
  role?: string; // Made optional to match UserResponse
  createdAt?: string; // Made optional
}

const users: User[] = [
  {
    id: 1,
    username: 'TestUser',
    displayName: 'Test User',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
];

const watchlist: WatchlistEntry[] = [];

export async function getUserByUsername(username: string): Promise<User | undefined> {
  return users.find((user) => user.username === username);
}

export async function createUser(data: InsertUser): Promise<User> {
  const newUser: User = {
    id: users.length + 1,
    username: data.username,
    displayName: data.displayName,
    role: 'user', // Default role
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
}

export async function getWatchlist(userId: number): Promise<WatchlistEntry[]> {
  return watchlist.filter((entry) => entry.userId === userId);
}

export async function addToWatchlist(userId: number, tmdbId: number): Promise<WatchlistEntry> {
  const entry: WatchlistEntry = {
    id: watchlist.length + 1,
    userId,
    tmdbId,
    status: 'toWatch',
    createdAt: new Date().toISOString(),
    movie: {
      tmdbId,
      title: `Mock Movie ${tmdbId}`,
      posterPath: '',
      mediaType: 'movie',
      overview: '',
      releaseDate: '',
      voteAverage: 0,
      backdropPath: '',
      genres: '',
    },
  };
  watchlist.push(entry);
  return entry;
}
