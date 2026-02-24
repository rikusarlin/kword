import { createDatabaseConnection } from '../db/schema';

async function main() {
  const db = createDatabaseConnection();

  try {
    // Create word table
    await db.schema
      .createTable('word')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('korean', 'varchar(255)', (col) => col.notNull())
      .addColumn('english', 'varchar(255)', (col) => col.notNull())
      .addColumn('part_of_speech', 'varchar(20)', (col) => col.notNull())
      .addColumn('image_url', 'varchar(500)')
      .addColumn('memorable_rule', 'text')
      .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()'))
      .execute();

    // Create user table
    await db.schema
      .createTable('user')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('nickname', 'varchar(100)', (col) => col.notNull())
      .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()'))
      .execute();

    // Create session table
    await db.schema
      .createTable('session')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('user_id', 'integer', (col) => col.notNull().references('user.id'))
      .addColumn('total_questions', 'integer', (col) => col.notNull())
      .addColumn('correct_answers', 'integer', (col) => col.notNull())
      .addColumn('time_taken_seconds', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()'))
      .execute();

    // Create mistake table
    await db.schema
      .createTable('mistake')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('session_id', 'integer', (col) => col.notNull().references('session.id'))
      .addColumn('word_id', 'integer', (col) => col.notNull().references('word.id'))
      .addColumn('question_type', 'varchar(100)', (col) => col.notNull())
      .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()'))
      .execute();

    // Create high_score table
    await db.schema
      .createTable('high_score')
      .ifNotExists()
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('user_id', 'integer', (col) => col.notNull().references('user.id'))
      .addColumn('nickname', 'varchar(100)', (col) => col.notNull())
      .addColumn('total_sessions', 'integer', (col) => col.notNull())
      .addColumn('average_accuracy', 'decimal', (col) => col.notNull())
      .addColumn('best_session_accuracy', 'decimal', (col) => col.notNull())
      .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()'))
      .execute();

    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

main();
