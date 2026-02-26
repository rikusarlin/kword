import { createDatabaseConnection } from '../db/schema';
import * as fs from 'fs';
import * as path from 'path';

async function parseVocabularyFile(filePath: string): Promise<Array<{korean: string, english: string, part_of_speech: 'noun' | 'verb' | 'adjective' | 'other'}>> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  const vocabulary: Array<{korean: string, english: string, part_of_speech: 'noun' | 'verb' | 'adjective' | 'other'}> = [];
  
  for (const line of lines) {
    const parts = line.split(';');
    if (parts.length >= 3) {
      const korean = parts[0].trim();
      const english = parts[1].trim();
      const partOfSpeech = parts[2].trim() as 'noun' | 'verb' | 'adjective' | 'other';
      
      // Only include words with valid parts of speech
      if (partOfSpeech === 'noun' || partOfSpeech === 'verb' || partOfSpeech === 'adjective' || partOfSpeech === 'other') {
        vocabulary.push({
          korean,
          english,
          part_of_speech: partOfSpeech
        });
      }
    }
  }
  
  return vocabulary;
}

async function seedWords() {
  const db = createDatabaseConnection();

  try {
    console.log('Seeding vocabulary data...');
    
    // Read all three TOPIK files
    const baseDir = path.resolve(__dirname, '../../');
    const files = [
      path.join(baseDir, 'TOPIK-I-1-with-classes.txt'),
      path.join(baseDir, 'TOPIK-I-2-with-classes.txt'),
      path.join(baseDir, 'TOPIK-I-3-with-classes.txt')
    ];

    let totalWords = 0;
    
    for (const file of files) {
      console.log(`Processing ${path.basename(file)}...`);
      const vocabulary = await parseVocabularyFile(file);
      
      for (const word of vocabulary) {
        try {
          await db.insertInto('word')
            .values({
              korean: word.korean,
              english: word.english,
              part_of_speech: word.part_of_speech,
              created_at: new Date()
            })
            .execute();
          totalWords++;
        } catch (error) {
          console.error(`Error inserting word ${word.korean}:`, error);
        }
      }
      
      console.log(`Inserted ${vocabulary.length} words from ${path.basename(file)}`);
    }
    
    console.log(`Seeding completed! Total words inserted: ${totalWords}`);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

seedWords();
