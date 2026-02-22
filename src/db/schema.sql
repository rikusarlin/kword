-- Users table - stores user information
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Words table - stores Korean vocabulary with English translations
CREATE TABLE IF NOT EXISTS words (
  id SERIAL PRIMARY KEY,
  korean VARCHAR(255) NOT NULL,
  english VARCHAR(255) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table - stores quiz session information
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  total_questions INTEGER NOT NULL DEFAULT 20,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_time_seconds INTEGER,
  CONSTRAINT check_correct_answers CHECK (correct_answers >= 0 AND correct_answers <= total_questions)
);

-- Answers table - stores individual answers within sessions
CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Mistakes table - tracks words that users got wrong
CREATE TABLE IF NOT EXISTS mistakes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  mistake_count INTEGER NOT NULL DEFAULT 1,
  last_mistake_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, word_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_session_id ON answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_word_id ON answers(word_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_user_id ON mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_word_id ON mistakes(word_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_count ON mistakes(mistake_count DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at DESC);
