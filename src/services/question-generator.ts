import { db } from '../db/database.js';
import { Word } from '../db/types.js';

export enum QuestionType {
  KOREAN_ENGLISH_MATCH = 'korean_english_match',
  IMAGE_MATCH = 'image_match',
  SENTENCE_COMPLETION = 'sentence_completion',
  PREVIOUS_MISTAKE = 'previous_mistake',
}

export interface Question {
  id: string;
  type: QuestionType;
  wordId: number;
  korean?: string;
  english?: string;
  options?: Array<{ korean: string; english: string; wordId: number }>;
  sentence?: string;
  correctAnswer?: string;
}

/**
 * Generate 20 questions with the correct distribution:
 * - 10 Korean-English matching
 * - 4 Image matching
 * - 6 Sentence completion (or more if we have previous mistakes)
 * - 2 Previous mistakes (if available, otherwise add to sentence completion)
 */
export async function generateQuestions(userId: number): Promise<Question[]> {
  const questions: Question[] = [];

  // Get user's previous mistakes
  const mistakeWords = await db
    .selectFrom('mistakes')
    .innerJoin('words', 'words.id', 'mistakes.word_id')
    .where('mistakes.user_id', '=', userId)
    .where('mistakes.mistake_count', '>', 0)
    .select(['words.id', 'words.korean', 'words.english'])
    .orderBy('mistakes.mistake_count', 'desc')
    .limit(2)
    .execute();

  // Get random words for general questions
  const allWords = await db
    .selectFrom('words')
    .selectAll()
    .orderBy(db.fn('random'))
    .limit(50)
    .execute();

  let wordIndex = 0;

  // Helper to get next word
  const getNextWord = (): Word => {
    if (wordIndex >= allWords.length) wordIndex = 0;
    return allWords[wordIndex++]!;
  };

  // Helper to get multiple words for options
  const getWords = (count: number): Word[] => {
    const words: Word[] = [];
    for (let i = 0; i < count; i++) {
      words.push(getNextWord());
    }
    return words;
  };

  // 1. Add 2 previous mistakes questions (or fill with other types)
  const mistakeCount = mistakeWords.length;
  for (let i = 0; i < mistakeCount; i++) {
    const mistake = mistakeWords[i]!;
    // Get 4 more words for options (total 5 including the correct one)
    const extraWords = getWords(4);
    const allOptions = [mistake, ...extraWords];
    const shuffledOptions = shuffleArray(allOptions);

    questions.push({
      id: `q${questions.length + 1}`,
      type: QuestionType.PREVIOUS_MISTAKE,
      wordId: mistake.id,
      korean: mistake.korean,
      options: shuffledOptions.map((w) => ({
        korean: w.korean,
        english: w.english,
        wordId: w.id,
      })),
      correctAnswer: mistake.english,
    });
  }

  // 2. Add 10 Korean-English matching questions
  for (let i = 0; i < 10; i++) {
    const words = getWords(5);
    const correctWord = words[0]!;
    // Shuffle to make correct answer position random
    const shuffledWords = shuffleArray(words);

    questions.push({
      id: `q${questions.length + 1}`,
      type: QuestionType.KOREAN_ENGLISH_MATCH,
      wordId: correctWord.id,
      korean: correctWord.korean,
      options: shuffledWords.map((w) => ({
        korean: w.korean,
        english: w.english,
        wordId: w.id,
      })),
      correctAnswer: correctWord.english,
    });
  }

  // 3. Add 4 image matching questions
  for (let i = 0; i < 4; i++) {
    const words = getWords(4);
    const correctWord = words[0]!;
    const shuffledWords = shuffleArray(words);

    questions.push({
      id: `q${questions.length + 1}`,
      type: QuestionType.IMAGE_MATCH,
      wordId: correctWord.id,
      korean: correctWord.korean,
      english: correctWord.english,
      options: shuffledWords.map((w) => ({
        korean: w.korean,
        english: w.english,
        wordId: w.id,
      })),
      correctAnswer: correctWord.english,
    });
  }

  // 4. Add sentence completion questions
  // These are reverse matching: show English, select Korean
  // Add 6 normally, or 8 if we had 0 mistakes, 7 if we had 1 mistake
  const sentenceCount = mistakeCount < 2 ? 6 + (2 - mistakeCount) : 6;

  for (let i = 0; i < sentenceCount; i++) {
    const words = getWords(4);
    const correctWord = words[0]!;
    const shuffledWords = shuffleArray(words);

    // Show the English word and ask for Korean translation
    const sentence = `"${correctWord.english}"`;

    questions.push({
      id: `q${questions.length + 1}`,
      type: QuestionType.SENTENCE_COMPLETION,
      wordId: correctWord.id,
      sentence,
      options: shuffledWords.map((w) => ({
        korean: w.korean,
        english: w.english,
        wordId: w.id,
      })),
      correctAnswer: correctWord.korean,
    });
  }

  // Shuffle questions
  return shuffleArray(questions);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}
