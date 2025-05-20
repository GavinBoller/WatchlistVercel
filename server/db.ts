import { UserResponse, Movie, WatchlistEntry } from '@shared/schema';

// Mock database for testing
const mockUsers: UserResponse[] = [
  {
    id: 1,
    username: 'TestUser',
    displayName: 'Test User',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
];

const mockWatchlist: WatchlistEntry[] = [];

export const db = {
  getUserById: async (id: number): Promise<UserResponse | null> => {
    return mockUsers.find((user) => user.id === id) || null;
  },
  getUserByUsername: async (username: string): Promise<UserResponse | null> => {
    return mockUsers.find((user) => user.username === username) || null;
  },
  verifyUser: async (username: string, password: string): Promise<UserResponse | null> => {
    // Mock password check (insecure, for testing only)
    const user = mockUsers.find((user) => user.username === username && password === 'password');
    return user || null;
  },
  createUser: async (username: string, password: string, displayName: string): Promise<UserResponse> => {
    const newUser: UserResponse = {
      id: mockUsers.length + 1,
      username,
      displayName,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return newUser;
  },
  getWatchlist: async (userId: number): Promise<WatchlistEntry[]> => {
    return mockWatchlist.filter((entry) => entry.userId === userId);
  },
  getWatchlistEntry: async (userId: number, tmdbId: number): Promise<WatchlistEntry | null> => {
    return mockWatchlist.find((entry) => entry.userId === userId && entry.tmdbId === tmdbId) || null;
  },
  addToWatchlist: async (userId: number, tmdbId: number, movie: Movie, status: 'toWatch' | 'watched', notes?: string): Promise<WatchlistEntry> => {
    const entry: WatchlistEntry = {
      id: mockWatchlist.length + 1,
      userId,
      tmdbId,
      movie,
      status,
      notes,
      createdAt: new Date().toISOString(),
    };
    mockWatchlist.push(entry);
    return entry;
  },
  updateWatchlistEntry: async (userId: number, id: number, updates: Partial<WatchlistEntry>): Promise<WatchlistEntry | null> => {
    const entry = mockWatchlist.find((e) => e.userId === userId && e.id === id);
    if (!entry) return null;
    Object.assign(entry, updates);
    return entry;
  },
  deleteWatchlistEntry: async (userId: number, id: number): Promise<boolean> => {
    const index = mockWatchlist.findIndex((e) => e.userId === userId && e.id === id);
    if (index === -1) return false;
    mockWatchlist.splice(index, 1);
    return true;
  },
};
