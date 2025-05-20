import { Router } from 'express';
import watchlistRoutes from './watchlistRoutes';
import { getUserByUsername } from './db';

describe('Watchlist Routes', () => {
  let router: Router;

  beforeEach(() => {
    router = watchlistRoutes;
  });

  it('should handle /api/auth/status', async () => {
    const req = { session: {} } as any;
    const res = { json: jest.fn() } as any;
    const next = jest.fn();
    const layer = router.stack.find(layer => layer.route?.path === '/api/auth/status');
    if (!layer || !layer.route) throw new Error('Route not found');
    const handler = layer.route.stack[0].handle;
    await handler(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ authenticated: false, user: null });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle /api/auth/login', async () => {
    const req = { body: { username: 'TestUser', password: 'password' }, session: {} } as any;
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;
    const next = jest.fn();
    jest.spyOn(require('./db'), 'getUserByUsername').mockResolvedValue({
      id: 1,
      username: 'TestUser',
      displayName: 'Test User',
      role: 'user',
      createdAt: new Date().toISOString(),
    });
    const layer = router.stack.find(layer => layer.route?.path === '/api/auth/login');
    if (!layer || !layer.route) throw new Error('Route not found');
    const handler = layer.route.stack[0].handle;
    await handler(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authenticated: true }));
    expect(next).not.toHaveBeenCalled();
  });
});
