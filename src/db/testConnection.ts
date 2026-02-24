import { createDatabaseConnection } from './schema';

async function testConnection() {
  try {
    const db = createDatabaseConnection();
    
    // Test basic connection with a simple query
    const result = await db.selectFrom('word').select((eb) => eb.val(1).as('count')).execute();
    console.log('Database connection successful:', result);
    
    // Test table existence by trying to select from a known table
    try {
      await db.selectFrom('word').select((eb) => eb.val(1).as('count')).execute();
      console.log('Word table exists');
    } catch (error) {
      console.log('Word table does not exist yet');
    }
    
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
