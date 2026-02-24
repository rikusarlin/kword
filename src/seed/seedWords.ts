import { createDatabaseConnection } from '../db/schema';

// Sample vocabulary data for seeding
const sampleVocabulary = [
  {
    korean: '사과',
    english: 'apple',
    part_of_speech: 'noun' as const,
    memorable_rule: 'Think of a "sack" full of "goes" (사과) into the basket'
  },
  {
    korean: '물',
    english: 'water',
    part_of_speech: 'noun' as const,
    memorable_rule: 'Imagine "mule" carrying water (물)'
  },
  {
    korean: '책',
    english: 'book',
    part_of_speech: 'noun' as const,
    memorable_rule: 'Imagine a "chuck" (책) of books'
  },
  {
    korean: '학교',
    english: 'school',
    part_of_speech: 'noun' as const,
    memorable_rule: 'Think of "school" sounding like "school" (학교)'
  },
  {
    korean: '친구',
    english: 'friend',
    part_of_speech: 'noun' as const,
    memorable_rule: 'Imagine "chingu" (friend) as a "chin" that you talk to'
  },
  {
    korean: '밥',
    english: 'rice/meal',
    part_of_speech: 'noun' as const,
    memorable_rule: 'Think of "bap" (rice) being served'
  },
  {
    korean: '물다',
    english: 'to bite',
    part_of_speech: 'verb' as const,
    memorable_rule: 'Imagine "mule" biting you (물다)'
  },
  {
    korean: '가다',
    english: 'to go',
    part_of_speech: 'verb' as const,
    memorable_rule: 'Think of "go" (가다)'
  },
  {
    korean: '보다',
    english: 'to see/look',
    part_of_speech: 'verb' as const,
    memorable_rule: 'Imagine "bo" (보) as eyes looking'
  },
  {
    korean: '예쁘다',
    english: 'to be pretty',
    part_of_speech: 'adjective' as const,
    memorable_rule: 'Think of "yep" (예) + "p" (pretty) = "yes, it\'s pretty" (예쁘다)'
  },
  {
    korean: '크다',
    english: 'to be big',
    part_of_speech: 'adjective' as const,
    memorable_rule: 'Imagine "kru" (크) as a large person'
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
            memorable_rule: word.memorable_rule,
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
