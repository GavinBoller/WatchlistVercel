import { db } from './db';

describe('Database Mock', () => {
  test('getUserById returns user', async () => {
    const user = await db.getUserById(1);
    expect(user).toEqual({
      id: 1,
      username: 'TestUser',
      displayName: 'Test User',
      role: 'user',
      createdAt: expect.any(String),
    });
  });
});
