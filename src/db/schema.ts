import {
  Kysely,
  PostgresDialect,
  Generated
} from 'kysely'
import { Pool } from 'pg'

export interface WordTable {
  id: Generated<number>
  korean: string
  english: string
  part_of_speech: 'noun' | 'verb' | 'adjective'
  image_url: string | null
  memorable_rule: string | null
  created_at: Generated<Date>
}

export interface UserTable {
  id: Generated<number>
  nickname: string
  created_at: Generated<Date>
}

export interface SessionTable {
  id: Generated<number>
  user_id: number
  total_questions: number
  correct_answers: number
  time_taken_seconds: number
  created_at: Generated<Date>
}

export interface MistakeTable {
  id: Generated<number>
  session_id: number
  word_id: number
  question_type: string
  created_at: Generated<Date>
}

export interface HighScoreTable {
  id: Generated<number>
  user_id: number
  nickname: string
  total_sessions: number
  average_accuracy: number
  best_session_accuracy: number
  created_at: Generated<Date>
}

export interface Database {
  word: WordTable
  user: UserTable
  session: SessionTable
  mistake: MistakeTable
  high_score: HighScoreTable
}

export function createDatabaseConnection(): Kysely<Database> {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'kword',
    user: 'kword-user',
    password: 'HanguelIsEasy',
  })

  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool })
  })
}