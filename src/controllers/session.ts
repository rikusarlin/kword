import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { generateQuestions, Question } from '../services/question-generator.js';

// Store active sessions in memory (in production, use Redis or similar)
const activeSessions = new Map<number, { questions: Question[]; startTime: Date }>();

export async function startSession(req: Request, res: Response) {
  try {
    const { userId } = req.body;

    if (!userId || typeof userId !== 'number') {
      return res.status(400).json({ error: 'Valid userId is required' });
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

    // Create new session
    const session = await db
      .insertInto('sessions')
      .values({
        user_id: userId,
        total_questions: 20,
        correct_answers: 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Generate questions
    const questions = await generateQuestions(userId);

    // Store in active sessions
    activeSessions.set(session.id, {
      questions,
      startTime: new Date(),
    });

    res.json({
      sessionId: session.id,
      questions,
      totalQuestions: 20,
    });
  } catch (error) {
    console.error('Error in startSession:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
}

export async function submitAnswer(req: Request, res: Response) {
  try {
    const sessionId = parseInt(req.params.sessionId || '');
    const { wordId, isCorrect, timeTakenSeconds } = req.body;

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid sessionId' });
    }

    if (typeof wordId !== 'number' || typeof isCorrect !== 'boolean' || typeof timeTakenSeconds !== 'number') {
      return res.status(400).json({ error: 'Invalid answer data' });
    }

    // Verify session exists
    const session = await db
      .selectFrom('sessions')
      .selectAll()
      .where('id', '=', sessionId)
      .executeTakeFirst();

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Record answer
    await db
      .insertInto('answers')
      .values({
        session_id: sessionId,
        word_id: wordId,
        is_correct: isCorrect,
        time_taken_seconds: timeTakenSeconds,
      })
      .execute();

    // Update session correct count if answer is correct
    if (isCorrect) {
      await db
        .updateTable('sessions')
        .set({ correct_answers: session.correct_answers + 1 })
        .where('id', '=', sessionId)
        .execute();
    }

    // If incorrect, update or create mistake record
    if (!isCorrect) {
      const existingMistake = await db
        .selectFrom('mistakes')
        .selectAll()
        .where('user_id', '=', session.user_id)
        .where('word_id', '=', wordId)
        .executeTakeFirst();

      if (existingMistake) {
        await db
          .updateTable('mistakes')
          .set({
            mistake_count: existingMistake.mistake_count + 1,
            last_mistake_at: new Date().toISOString(),
          })
          .where('id', '=', existingMistake.id)
          .execute();
      } else {
        await db
          .insertInto('mistakes')
          .values({
            user_id: session.user_id,
            word_id: wordId,
            mistake_count: 1,
          })
          .execute();
      }
    } else {
      // If correct and it was a previous mistake, decrement or remove
      const existingMistake = await db
        .selectFrom('mistakes')
        .selectAll()
        .where('user_id', '=', session.user_id)
        .where('word_id', '=', wordId)
        .executeTakeFirst();

      if (existingMistake) {
        if (existingMistake.mistake_count <= 1) {
          // Remove mistake entry
          await db.deleteFrom('mistakes').where('id', '=', existingMistake.id).execute();
        } else {
          // Decrement count
          await db
            .updateTable('mistakes')
            .set({ mistake_count: existingMistake.mistake_count - 1 })
            .where('id', '=', existingMistake.id)
            .execute();
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in submitAnswer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
}

export async function completeSession(req: Request, res: Response) {
  try {
    const sessionId = parseInt(req.params.sessionId || '');

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid sessionId' });
    }

    const sessionData = activeSessions.get(sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found or already completed' });
    }

    // Calculate total time
    const totalTimeSeconds = Math.floor((new Date().getTime() - sessionData.startTime.getTime()) / 1000);

    // Update session
    const session = await db
      .updateTable('sessions')
      .set({
        completed_at: new Date().toISOString(),
        total_time_seconds: totalTimeSeconds,
      })
      .where('id', '=', sessionId)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Remove from active sessions
    activeSessions.delete(sessionId);

    // Calculate percentage
    const percentage = Math.round((session.correct_answers / session.total_questions) * 100);

    res.json({
      sessionId: session.id,
      totalQuestions: session.total_questions,
      correctAnswers: session.correct_answers,
      percentage,
      totalTimeSeconds,
    });
  } catch (error) {
    console.error('Error in completeSession:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
}

export async function getSessionResults(req: Request, res: Response) {
  try {
    const sessionId = parseInt(req.params.sessionId || '');

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid sessionId' });
    }

    // Get session
    const session = await db
      .selectFrom('sessions')
      .selectAll()
      .where('id', '=', sessionId)
      .executeTakeFirst();

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate percentage
    const percentage = Math.round((session.correct_answers / session.total_questions) * 100);

    res.json({
      sessionId: session.id,
      totalQuestions: session.total_questions,
      correctAnswers: session.correct_answers,
      percentage,
      totalTimeSeconds: session.total_time_seconds || 0,
    });
  } catch (error) {
    console.error('Error in getSessionResults:', error);
    res.status(500).json({ error: 'Failed to get session results' });
  }
}

export async function getMistakeHelp(req: Request, res: Response) {
  try {
    const wordId = parseInt(req.params.wordId || '');

    if (isNaN(wordId)) {
      return res.status(400).json({ error: 'Invalid wordId' });
    }

    // Get the word
    const word = await db
      .selectFrom('words')
      .selectAll()
      .where('id', '=', wordId)
      .executeTakeFirst();

    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    // Generate simple memory tips
    const tips = [
      `The Korean word "${word.korean}" means "${word.english}".`,
      `Try to associate "${word.korean}" with something familiar to help remember it.`,
      `Practice writing "${word.korean}" multiple times to build muscle memory.`,
      `Use "${word.korean}" in a sentence to better remember its context.`,
    ];

    // Add specific tips based on word characteristics
    if (word.korean.length <= 2) {
      tips.push(`This is a short word - "${word.korean}". Short words are often easier to remember!`);
    }

    if (word.english.includes(',')) {
      tips.push(`This word has multiple meanings: ${word.english}. Try to learn the most common usage first.`);
    }

    res.json({
      word: {
        korean: word.korean,
        english: word.english,
      },
      tips,
    });
  } catch (error) {
    console.error('Error in getMistakeHelp:', error);
    res.status(500).json({ error: 'Failed to get mistake help' });
  }
}
