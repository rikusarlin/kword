import { db } from './database.js';
import { vocabularyData } from './vocabulary-data.js';

async function seed() {
  console.log('Starting database seeding...');

  try {
    // Check if vocabulary data already exists
    const existingWords = await db
      .selectFrom('words')
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();

    const count = Number(existingWords?.count || 0);

    if (count > 0) {
      console.log(`✓ Database already contains ${count} words. Skipping seed.`);
      console.log('\n✅ Seeding completed successfully!');
      return;
    }

    console.log(`Inserting ${vocabularyData.length} vocabulary entries...`);

    // Insert vocabulary data in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < vocabularyData.length; i += batchSize) {
      const batch = vocabularyData.slice(i, i + batchSize);
      await db.insertInto('words').values(batch).execute();
      console.log(`✓ Inserted ${Math.min(i + batchSize, vocabularyData.length)} / ${vocabularyData.length} words`);
    }

    console.log(`\n✅ Successfully seeded ${vocabularyData.length} vocabulary entries!`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  });
}

export { seed };
