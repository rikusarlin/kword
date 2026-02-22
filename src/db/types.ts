import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

// User table
export interface UserTable {
  id: Generated<number>;
  nickname: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

// Word table
export interface WordTable {
  id: Generated<number>;
  korean: string;
  english: string;
  image_url: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type Word = Selectable<WordTable>;
export type NewWord = Insertable<WordTable>;
export type WordUpdate = Updateable<WordTable>;

// Session table
export interface SessionTable {
  id: Generated<number>;
  user_id: number;
  started_at: ColumnType<Date, string | undefined, never>;
  completed_at: Date | null;
  total_questions: number;
  correct_answers: number;
  total_time_seconds: number | null;
}

export type Session = Selectable<SessionTable>;
export type NewSession = Insertable<SessionTable>;
export type SessionUpdate = Updateable<SessionTable>;

// Answer table
export interface AnswerTable {
  id: Generated<number>;
  session_id: number;
  word_id: number;
  is_correct: boolean;
  time_taken_seconds: number;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type Answer = Selectable<AnswerTable>;
export type NewAnswer = Insertable<AnswerTable>;
export type AnswerUpdate = Updateable<AnswerTable>;

// Mistake table (tracks words that user got wrong)
export interface MistakeTable {
  id: Generated<number>;
  user_id: number;
  word_id: number;
  mistake_count: number;
  last_mistake_at: ColumnType<Date, string | undefined, never>;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type Mistake = Selectable<MistakeTable>;
export type NewMistake = Insertable<MistakeTable>;
export type MistakeUpdate = Updateable<MistakeTable>;

// Database interface
export interface Database {
  users: UserTable;
  words: WordTable;
  sessions: SessionTable;
  answers: AnswerTable;
  mistakes: MistakeTable;
}
