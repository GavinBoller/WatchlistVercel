import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';

config();

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

export const storage = {
  async getUserByUsername(username: string): Promise<schema.UserResponse | null> {
    const result = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return result[0] || null;
  },
  async createUser(user: {
    username: string;
    password: string;
    displayName: string;
    role: string;
    createdAt: Date;
  }): Promise<schema.UserResponse> {
    const [newUser] = await db
      .insert(schema.users)
      .values({
        username: user.username,
        password: user.password,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      })
      .returning();
    return {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  },
};