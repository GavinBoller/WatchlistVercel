import { Router } from 'express';
import watchlistRoutes from './src/watchlistRoutes';
import { getUserByUsername, createUser, getWatchlist, addToWatchlist } from './db';

describe('Watchlist Routes', () => {
  let router: Router;

  beforeEach(() => {
    router = watchlistRoutes;
  });

  it('should handle /api/auth/status', async () => {
    const req = { session: {} };
    const res = { json: jest.fn() };
    const next = jest.fn();
    await router.get('/api/auth/status')(req as any, res as any, next);
    expect(res.json).toHaveBeenCalledWith({ authenticated: false, user: null });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle /api/auth/login', async () => {
    const req = { body: { username: 'TestUser', password: 'password' }, session: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    const next = jest.fn();
    await router.post('/api/auth/login')(req as any, res as any, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authenticated: true }));
    expect(next).not.toHaveBeenCalled();
  });
});
