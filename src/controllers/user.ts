import { Request, Response } from 'express';
import { db } from '../db/database.js';

export async function createOrGetUser(req: Request, res: Response) {
  try {
    const { nickname } = req.body;

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return res.status(400).json({ error: 'Nickname is required' });
    }

    const trimmedNickname = nickname.trim();

    // Check if user already exists
    let user = await db
      .selectFrom('users')
      .selectAll()
      .where('nickname', '=', trimmedNickname)
      .executeTakeFirst();

    // Create user if doesn't exist
    if (!user) {
      user = await db
        .insertInto('users')
        .values({ nickname: trimmedNickname })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    res.json({ user });
  } catch (error) {
    console.error('Error in createOrGetUser:', error);
    res.status(500).json({ error: 'Failed to create or get user' });
  }
}
