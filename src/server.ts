import express, { Request, Response } from 'express';
import { createDatabaseConnection } from './db/schema'

const app = express();
const port = 3001;

app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const db = createDatabaseConnection();
    const result = await db
      .selectFrom('user')
      .select('id')
      .limit(1)
      .execute()
    res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: (error as Error).message
    })
  }
})

// User registration/identification endpoint
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const db = createDatabaseConnection();
    const { nickname } = req.body;
    
    if (!nickname || nickname.trim() === '') {
      return res.status(400).json({ error: 'Nickname is required' });
    }
    
    // Check if user exists
    let user = await db.selectFrom('user')
      .where('nickname', '=', nickname)
      .selectAll()
      .executeTakeFirst();
    
    if (!user) {
      // Create new user
      const newUser = await db.insertInto('user')
        .values({ nickname })
        .returningAll()
        .executeTakeFirst();
      
      if (!newUser) {
        return res.status(500).json({ error: 'Failed to create user' });
      }
      
      user = newUser;
    }
    
    res.json({ id: user.id, nickname: user.nickname });
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const db = createDatabaseConnection();
    const { id } = req.params;
    
    const user = await db.selectFrom('user')
      .where('id', '=', Number(id))
      .selectAll()
      .executeTakeFirst();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ id: user.id, nickname: user.nickname });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session questions
app.post('/api/sessions', async (req: Request, res: Response) => {
  try {
    const db = createDatabaseConnection();
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get all words
    const words = await db.selectFrom('word').selectAll().execute();
    
    if (words.length === 0) {
      return res.status(404).json({ error: 'No words found in database' });
    }
    
    // Get user's mistakes
    const mistakes = await db.selectFrom('mistake')
      .innerJoin('session', 'mistake.session_id', 'session.id')
      .where('session.user_id', '=', user_id)
      .select(['word_id'])
      .execute();
    
    const mistakeWordIds = mistakes.map(m => m.word_id);
    
    // Generate 20 questions with distribution:
    // - 10 Korean-English matching
    // - 4 image matching
    // - 2 text input (Korean writing)
    // - 4 sentence completion
    // - 2 from user's mistakes
    
    const questionCount = 20;
    
    // Separate words into mistake and non-mistake
    const mistakeWords = words.filter(w => mistakeWordIds.includes(w.id));
    const otherWords = words.filter(w => !mistakeWordIds.includes(w.id));
    
    // Ensure we have at least 2 mistake words if available
    let selectedMistakeWords: typeof words = [];
    if (mistakeWords.length > 0) {
      // Shuffle and pick up to 2
      const shuffledMistakes = [...mistakeWords].sort(() => Math.random() - 0.5);
      selectedMistakeWords = shuffledMistakes.slice(0, 2);
    }
    
    // Fill remaining with other words
    const remainingCount = questionCount - selectedMistakeWords.length;
    let selectedOtherWords: typeof words = [];
    
    if (otherWords.length >= remainingCount) {
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
      selectedOtherWords = shuffledOthers.slice(0, remainingCount);
    } else {
      // If not enough other words, use all available
      selectedOtherWords = [...otherWords];
    }
    
    const selectedWords = [...selectedMistakeWords, ...selectedOtherWords];
    
    // Ensure we have exactly 20 words (pad with random words if needed)
    while (selectedWords.length < questionCount) {
      const randomWord = words[Math.floor(Math.random() * words.length)];
      if (!selectedWords.find(w => w.id === randomWord.id)) {
        selectedWords.push(randomWord);
      }
    }
    
    // Limit to 20 words
    const finalWords = selectedWords.slice(0, questionCount);
    
    // Create questions with appropriate types
    const questions = finalWords.map((word, index) => {
      // Determine question type based on distribution
      let questionType: 'matching' | 'image' | 'text_input' | 'sentence';
      
      if (index < 10) {
        questionType = 'matching'; // First 10: matching
      } else if (index < 14) {
        questionType = 'image'; // Next 4: image
      } else if (index < 16) {
        questionType = 'text_input'; // Next 2: text input
      } else {
        questionType = 'sentence'; // Remaining 4: sentence completion
      }
      
      return {
        id: word.id,
        korean: word.korean,
        english: word.english,
        part_of_speech: word.part_of_speech,
        image_url: word.image_url,
        memorable_rule: word.memorable_rule,
        question_type: questionType
      };
    });
    
    // Create session record
    const session = await db.insertInto('session')
      .values({
        user_id,
        total_questions: questionCount,
        correct_answers: 0,
        time_taken_seconds: 0
      })
      .returningAll()
      .executeTakeFirst();
    
    if (!session) {
      return res.status(500).json({ error: 'Failed to create session' });
    }
    
    res.json({ 
      session_id: session.id,
      questions
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit answers
app.post('/api/sessions/:id/answers', async (req: Request, res: Response) => {
  try {
    const db = createDatabaseConnection();
    const { session_id } = req.params;
    const { answers, time_taken_seconds } = req.body;
    
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers are required' });
    }
    
    // Get session
    const session = await db.selectFrom('session')
      .where('id', '=', Number(session_id))
      .selectAll()
      .executeTakeFirst();
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Calculate correct answers and track mistakes
    let correctAnswers = 0;
    const mistakes = [];
    
    for (const answer of answers) {
      if (!answer.word_id || answer.answer === undefined) {
        continue;
      }
      
      // Check if answer is correct (for matching and sentence questions)
      // For image questions, we'll assume the user selected the correct image
      // For text input, we'll check if the provided Korean matches
      
      const word = await db.selectFrom('word')
        .where('id', '=', answer.word_id)
        .selectAll()
        .executeTakeFirst();
      
      if (word) {
        // Determine correctness based on question type
        let isCorrect = false;
        
        if (answer.question_type === 'matching' || answer.question_type === 'sentence') {
          // For matching and sentence questions, check if the English translation matches
          isCorrect = answer.answer === word.english;
        } else if (answer.question_type === 'image') {
          // For image questions, assume correct if answer is true
          isCorrect = answer.answer === true;
        } else if (answer.question_type === 'text_input') {
          // For text input, check if the provided Korean matches
          isCorrect = answer.answer === word.korean;
        }
        
        if (isCorrect) {
          correctAnswers++;
        } else {
          // Record mistake
          mistakes.push({
            session_id: Number(session_id),
            word_id: answer.word_id,
            question_type: answer.question_type
          });
        }
      }
    }
    
    // Update session with correct answers and time
    await db.updateTable('session')
      .set({ 
        correct_answers: correctAnswers,
        time_taken_seconds: time_taken_seconds || 0
      })
      .where('id', '=', Number(session_id))
      .execute();
    
    // Insert mistakes
    for (const mistake of mistakes) {
      await db.insertInto('mistake')
        .values(mistake)
        .execute();
    }
    
    // Update high scores
    const accuracy = (correctAnswers / session.total_questions) * 100;
    
    // Get or create high score record
    let highScore = await db.selectFrom('high_score')
      .where('user_id', '=', session.user_id)
      .selectAll()
      .executeTakeFirst();
    
    if (!highScore) {
      // Create new high score record
      const newUser = await db.selectFrom('user')
        .where('id', '=', session.user_id)
        .select('nickname')
        .executeTakeFirst();
      
      highScore = await db.insertInto('high_score')
        .values({
          user_id: session.user_id,
          nickname: newUser?.nickname || 'Unknown',
          total_sessions: 1,
          average_accuracy: accuracy,
          best_session_accuracy: accuracy
        })
        .returningAll()
        .executeTakeFirst();
    } else {
      // Update existing high score
      const newTotalSessions = highScore.total_sessions + 1;
      const newAverageAccuracy = ((highScore.average_accuracy * highScore.total_sessions) + accuracy) / newTotalSessions;
      const bestAccuracy = Math.max(highScore.best_session_accuracy, accuracy);
      
      await db.updateTable('high_score')
        .set({
          total_sessions: newTotalSessions,
          average_accuracy: newAverageAccuracy,
          best_session_accuracy: bestAccuracy
        })
        .where('id', '=', highScore.id)
        .execute();
    }
    
    res.json({
      session_id: Number(session_id),
      correct_answers: correctAnswers,
      total_questions: session.total_questions,
      accuracy: accuracy
    });
  } catch (error) {
    console.error('Error submitting answers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get high scores
app.get('/api/high-scores', async (req: Request, res: Response) => {
  try {
    const db = createDatabaseConnection();
    
    // Get global top 10
    const globalTop10 = await db.selectFrom('high_score')
      .selectAll()
      .orderBy('best_session_accuracy', 'desc')
      .limit(10)
      .execute();
    
    res.json({ global_top_10: globalTop10 });
  } catch (error) {
    console.error('Error fetching high scores:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get personal high scores
app.get('/api/users/:id/high-scores', async (req: Request, res: Response) => {
  try {
    const db = createDatabaseConnection();
    const { id } = req.params;
    
    const highScores = await db.selectFrom('high_score')
      .where('user_id', '=', Number(id))
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
    
    res.json({ personal_high_scores: highScores });
  } catch (error) {
    console.error('Error fetching personal high scores:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get memorable rules for mistakes
app.get('/api/users/:id/mistakes', async (req: Request, res: Response) => {
  try {
    const db = createDatabaseConnection();
    const { id } = req.params;
    
    // Get user's mistakes with word details
    const mistakes = await db.selectFrom('mistake')
      .innerJoin('session', 'mistake.session_id', 'session.id')
      .where('session.user_id', '=', Number(id))
      .innerJoin('word', 'mistake.word_id', 'word.id')
      .select([
        'mistake.id',
        'mistake.word_id',
        'word.korean',
        'word.english',
        'word.memorable_rule'
      ])
      .execute();
    
    res.json({ mistakes });
  } catch (error) {
    console.error('Error fetching mistakes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session results by ID
app.get('/api/sessions/:id/results', async (req: Request, res: Response) => {
  try {
    const db = createDatabaseConnection();
    const { id } = req.params;
    
    const session = await db.selectFrom('session')
      .where('id', '=', Number(id))
      .selectAll()
      .executeTakeFirst();
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get user info
    const user = await db.selectFrom('user')
      .where('id', '=', session.user_id)
      .selectAll()
      .executeTakeFirst();
    
    // Get mistakes for this session
    const mistakes = await db.selectFrom('mistake')
      .where('session_id', '=', Number(id))
      .innerJoin('word', 'mistake.word_id', 'word.id')
      .select([
        'mistake.word_id',
        'word.korean',
        'word.english',
        'mistake.question_type'
      ])
      .execute();
    
    res.json({
      session_id: session.id,
      user_id: session.user_id,
      nickname: user?.nickname || 'Unknown',
      total_questions: session.total_questions,
      correct_answers: session.correct_answers,
      time_taken_seconds: session.time_taken_seconds,
      accuracy: (session.correct_answers / session.total_questions) * 100,
      mistakes
    });
  } catch (error) {
    console.error('Error fetching session results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
