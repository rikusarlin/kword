import { Request, Response } from 'express';
import { db } from '../db/database.js';

export async function getHighScores(req: Request, res: Response) {
  try {
    // Get top 10 global scores
    const scores = await db
      .selectFrom('sessions')
      .innerJoin('users', 'users.id', 'sessions.user_id')
      .where('sessions.completed_at', 'is not', null)
      .select([
        'sessions.id',
        'sessions.correct_answers',
        'sessions.total_questions',
        'sessions.total_time_seconds',
        'sessions.completed_at',
        'users.nickname',
      ])
      .orderBy('sessions.correct_answers', 'desc')
      .orderBy('sessions.total_time_seconds', 'asc')
      .limit(10)
      .execute();

    const formattedScores = scores.map((score, index) => ({
      rank: index + 1,
      nickname: score.nickname,
      correctAnswers: score.correct_answers,
      totalQuestions: score.total_questions,
      percentage: Math.round((score.correct_answers / score.total_questions) * 100),
      totalTimeSeconds: score.total_time_seconds,
      completedAt: score.completed_at,
    }));

    res.json({ scores: formattedScores });
  } catch (error) {
    console.error('Error in getHighScores:', error);
    res.status(500).json({ error: 'Failed to get high scores' });
  }
}

export async function getUserScores(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId || '');

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    // Verify user exists
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's top 10 scores
    const scores = await db
      .selectFrom('sessions')
      .where('user_id', '=', userId)
      .where('completed_at', 'is not', null)
      .select([
        'id',
        'correct_answers',
        'total_questions',
        'total_time_seconds',
        'completed_at',
      ])
      .orderBy('correct_answers', 'desc')
      .orderBy('total_time_seconds', 'asc')
      .limit(10)
      .execute();

    const formattedScores = scores.map((score, index) => ({
      rank: index + 1,
      sessionId: score.id,
      correctAnswers: score.correct_answers,
      totalQuestions: score.total_questions,
      percentage: Math.round((score.correct_answers / score.total_questions) * 100),
      totalTimeSeconds: score.total_time_seconds,
      completedAt: score.completed_at,
    }));

    res.json({
      user: {
        id: user.id,
        nickname: user.nickname,
      },
      scores: formattedScores,
    });
  } catch (error) {
    console.error('Error in getUserScores:', error);
    res.status(500).json({ error: 'Failed to get user scores' });
  }
}
