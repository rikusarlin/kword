import { createDatabaseConnection } from '../db/schema';

// Sample vocabulary data for seeding
const sampleVocabulary = [
  {
    korean: '사과',
    english: 'apple',
    part_of_speech: 'noun' as const
  },
  {
    korean: '물',
    english: 'water',
    part_of_speech: 'noun' as const
  },
  {
    korean: '책',
    english: 'book',
    part_of_speech: 'noun' as const
  },
  {
    korean: '학교',
    english: 'school',
    part_of_speech: 'noun' as const
  },
  {
    korean: '친구',
    english: 'friend',
    part_of_speech: 'noun' as const
  },
  {
    korean: '밥',
    english: 'rice/meal',
    part_of_speech: 'noun' as const
  },
  {
    korean: '물다',
    english: 'to bite',
    part_of_speech: 'verb' as const
  },
  {
    korean: '가다',
    english: 'to go',
    part_of_speech: 'verb' as const
  },
  {
    korean: '보다',
    english: 'to see/look',
    part_of_speech: 'verb' as const
  },
  {
    korean: '예쁘다',
    english: 'to be pretty',
    part_of_speech: 'adjective' as const
  },
  {
    korean: '크다',
    english: 'to be big',
    part_of_speech: 'adjective' as const
  }
];

async function seedWords() {
  const db = createDatabaseConnection();

  try {
    console.log('Seeding vocabulary data...');
    
    for (const word of sampleVocabulary) {
      try {
        await db.insertInto('word')
          .values({
            korean: word.korean,
            english: word.english,
            part_of_speech: word.part_of_speech,
            created_at: new Date()
          })
          .execute();
        console.log(`Inserted word: ${word.korean} (${word.english})`);
      } catch (error) {
        console.error(`Error inserting word ${word.korean}:`, error);
      }
    }
    
    console.log('Seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

seedWords();
