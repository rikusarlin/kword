import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from './types.js';
import { dbConfig } from './config.js';

const dialect = new PostgresDialect({
  pool: new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
  }),
});

export const db = new Kysely<Database>({
  dialect,
});
