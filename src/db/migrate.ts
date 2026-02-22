import { sql } from 'kysely';
import { db } from './database.js';

async function migrate() {
  console.log('Starting database migration...');

  try {
    // Create users table
    await db.schema
      .createTable('users')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('nickname', 'varchar(255)', (col) => col.notNull().unique())
      .addColumn('created_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
      )
      .execute();
    console.log('✓ Created users table');

    // Create words table
    await db.schema
      .createTable('words')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('korean', 'varchar(255)', (col) => col.notNull())
      .addColumn('english', 'varchar(255)', (col) => col.notNull())
      .addColumn('image_url', 'text')
      .addColumn('created_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
      )
      .execute();
    console.log('✓ Created words table');

    // Create sessions table
    await db.schema
      .createTable('sessions')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('user_id', 'integer', (col) =>
        col.notNull().references('users.id').onDelete('cascade')
      )
      .addColumn('started_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
      )
      .addColumn('completed_at', 'timestamp')
      .addColumn('total_questions', 'integer', (col) => col.notNull().defaultTo(20))
      .addColumn('correct_answers', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('total_time_seconds', 'integer')
      .execute();
    console.log('✓ Created sessions table');

    // Create answers table
    await db.schema
      .createTable('answers')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('session_id', 'integer', (col) =>
        col.notNull().references('sessions.id').onDelete('cascade')
      )
      .addColumn('word_id', 'integer', (col) =>
        col.notNull().references('words.id').onDelete('cascade')
      )
      .addColumn('is_correct', 'boolean', (col) => col.notNull())
      .addColumn('time_taken_seconds', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
      )
      .execute();
    console.log('✓ Created answers table');

    // Create mistakes table
    await db.schema
      .createTable('mistakes')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('user_id', 'integer', (col) =>
        col.notNull().references('users.id').onDelete('cascade')
      )
      .addColumn('word_id', 'integer', (col) =>
        col.notNull().references('words.id').onDelete('cascade')
      )
      .addColumn('mistake_count', 'integer', (col) => col.notNull().defaultTo(1))
      .addColumn('last_mistake_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
      )
      .addColumn('created_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
      )
      .execute();
    console.log('✓ Created mistakes table');

    // Add unique constraint on mistakes table
    await db.schema
      .createIndex('mistakes_user_word_unique')
      .ifNotExists()
      .on('mistakes')
      .columns(['user_id', 'word_id'])
      .unique()
      .execute();
    console.log('✓ Created unique constraint on mistakes table');

    // Create indexes
    await db.schema
      .createIndex('idx_sessions_user_id')
      .ifNotExists()
      .on('sessions')
      .column('user_id')
      .execute();
    console.log('✓ Created index on sessions.user_id');

    await db.schema
      .createIndex('idx_answers_session_id')
      .ifNotExists()
      .on('answers')
      .column('session_id')
      .execute();
    console.log('✓ Created index on answers.session_id');

    await db.schema
      .createIndex('idx_answers_word_id')
      .ifNotExists()
      .on('answers')
      .column('word_id')
      .execute();
    console.log('✓ Created index on answers.word_id');

    await db.schema
      .createIndex('idx_mistakes_user_id')
      .ifNotExists()
      .on('mistakes')
      .column('user_id')
      .execute();
    console.log('✓ Created index on mistakes.user_id');

    await db.schema
      .createIndex('idx_mistakes_word_id')
      .ifNotExists()
      .on('mistakes')
      .column('word_id')
      .execute();
    console.log('✓ Created index on mistakes.word_id');

    await db.schema
      .createIndex('idx_mistakes_count')
      .ifNotExists()
      .on('mistakes')
      .column('mistake_count')
      .execute();
    console.log('✓ Created index on mistakes.mistake_count');

    await db.schema
      .createIndex('idx_sessions_completed_at')
      .ifNotExists()
      .on('sessions')
      .column('completed_at')
      .execute();
    console.log('✓ Created index on sessions.completed_at');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch((error) => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  });
}

export { migrate };
