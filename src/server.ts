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

// Get random words of the same type as given word id
app.get('/api/words/:id/similar', async (req: Request, res: Response) => {
  try {
    const db = createDatabaseConnection();
    const { id } = req.params;
    
    const wordId = Number(id);
    if (isNaN(wordId)) {
      return res.status(400).json({ error: 'Invalid word ID' });
    }
    
    // Get the reference word
    const referenceWord = await db.selectFrom('word')
      .where('id', '=', wordId)
      .select(['part_of_speech'])
      .executeTakeFirst();
    
    if (!referenceWord) {
      return res.status(404).json({ error: 'Word not found' });
    }
    
    // Get words of the same type
    const similarWords = await db.selectFrom('word')
      .where('id', '!=', wordId)
      .where('part_of_speech', '=', referenceWord.part_of_speech)
      .selectAll()
      .execute();
    
    res.json({ words: similarWords });
  } catch (error) {
    console.error('Error fetching similar words:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Form a session
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
    
    // Separate words into mistake and non-mistake
    const mistakeWords = words.filter(w => mistakeWordIds.includes(w.id));
    const otherWords = words.filter(w => !mistakeWordIds.includes(w.id));
    
    // Get sentence questions to know which words have them
    const sentenceQuestions = await db.selectFrom('sentence_question').selectAll().execute();
    const wordIdsWithSentences = new Set(sentenceQuestions.map(sq => sq.word_id));
    
    // Separate other words into those with and without sentences
    const otherWordsWithSentences = otherWords.filter(w => wordIdsWithSentences.has(w.id));
    const otherWordsWithoutSentences = otherWords.filter(w => !wordIdsWithSentences.has(w.id));
    
    // Determine question distribution
    let matchingCount = 12;
    let sentenceCount = 7;
    
    if (mistakeWords.length > 0) {
      // If there are mistakes, use 13 matching and 6 sentence
      matchingCount = 13;
      sentenceCount = 6;
    }
    
    // Ensure we have at least 2 mistake words if available
    let selectedMistakeWords: typeof words = [];
    if (mistakeWords.length > 0) {
      // Shuffle and pick up to 2
      const shuffledMistakes = [...mistakeWords].sort(() => Math.random() - 0.5);
      selectedMistakeWords = shuffledMistakes.slice(0, 2);
    }
    
    // Fill remaining matching questions with words that don't have sentences
    let selectedOtherWordsWithoutSentences: typeof words = [];
    const remainingMatchingCount = matchingCount - selectedMistakeWords.length;
    
    if (otherWordsWithoutSentences.length >= remainingMatchingCount) {
      const shuffledOthers = [...otherWordsWithoutSentences].sort(() => Math.random() - 0.5);
      selectedOtherWordsWithoutSentences = shuffledOthers.slice(0, remainingMatchingCount);
    } else {
      // If not enough words without sentences, use all available and adjust
      selectedOtherWordsWithoutSentences = [...otherWordsWithoutSentences];
    }
    
    // Fill sentence questions with words that have sentences
    let selectedOtherWordsWithSentences: typeof words = [];
    if (otherWordsWithSentences.length >= sentenceCount) {
      const shuffledOthers = [...otherWordsWithSentences].sort(() => Math.random() - 0.5);
      selectedOtherWordsWithSentences = shuffledOthers.slice(0, sentenceCount);
    } else {
      // If not enough words with sentences, use all available
      selectedOtherWordsWithSentences = [...otherWordsWithSentences];
    }
    
    // Calculate how many more words we need
    const totalSelected = selectedMistakeWords.length + 
                          selectedOtherWordsWithoutSentences.length + 
                          selectedOtherWordsWithSentences.length;
    
    const remainingCount = 20 - totalSelected;
    
    // Fill remaining with other words (with or without sentences as needed)
    let selectedAdditionalWords: typeof words = [];
    
    if (remainingCount > 0) {
      // Get available words not already selected
      const selectedWordIds = new Set([
        ...selectedMistakeWords.map(w => w.id),
        ...selectedOtherWordsWithoutSentences.map(w => w.id),
        ...selectedOtherWordsWithSentences.map(w => w.id)
      ]);
      
      const availableWords = words.filter(w => !selectedWordIds.has(w.id));
      
      if (availableWords.length >= remainingCount) {
        const shuffledAvailable = [...availableWords].sort(() => Math.random() - 0.5);
        selectedAdditionalWords = shuffledAvailable.slice(0, remainingCount);
      } else {
        // If not enough words, use all available
        selectedAdditionalWords = [...availableWords];
      }
    }
    
    const selectedWords = [
      ...selectedMistakeWords,
      ...selectedOtherWordsWithoutSentences,
      ...selectedOtherWordsWithSentences,
      ...selectedAdditionalWords
    ];
    
    // Limit to 20 words
    const finalWords = selectedWords.slice(0, 20);
    
    // Create questions with appropriate types
    const questions = finalWords.map((word, index) => {
      // Determine question type based on distribution
      let questionType: 'matching' | 'sentence';
      
      // Mistake words are always matching and come first
      if (selectedMistakeWords.some(mw => mw.id === word.id)) {
        questionType = 'matching';
      } else if (index < matchingCount) {
        questionType = 'matching'; // First N: matching
      } else {
        questionType = 'sentence'; // Remaining: sentence completion
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
        total_questions: 20,
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
    
    console.log(`session_id: ${session_id}`)
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
