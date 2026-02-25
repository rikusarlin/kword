# K-word
This project is intented to train words in Korean for English speakers.

The main problem we are trying to address here is that Hangul words are difficult to remember.

We are interested in basic vocabulary, which you have in TOPIK-I-1/2/3.txt files.
 d
There should be questions of various types to keep user's interest up. See next section.

## Question types
There are a few types of questions:
- Korean - English. Show 5 words, user needs to combine Korean and English words.
- Select right Hangul word to a Hangul sentence, given 4 choices
- Previous mistakes - ask a word which we've had problems with before

## Requirements
- Ask 20 questions of different types per session
- Keep track of mistakes by word so we can do "Previous mistakes" types of questions.
- Ask for name or nickname in the beginning
- Store results in database (number and percentage of correct answers, total time)
- In the end, show a nickname's high scores and "global high scores". Top 10 will do.

## Technologies
- PostgreSQL, with Kysely access, running in Docker container (port 5432). You can assume a Postgres DB is already up and running. Password is "HanguelIsEasy". Username is "kword-user", database name is "kword".
- Node.js and npm
- React with Tailwind in the frontend

## Setup Instructions

### Phase 1: Project Setup and Database Design
1. Install dependencies:
   ```
   npm install
   ```

2. Run database migrations to create tables:
   ```
   npm run migrate
   ```

3. Test the server and database connection:
   ```
   npm run dev
   ```
   Then visit http://localhost:3001/api/health to verify the connection.

## Command examples
Some command examples:
- Fetching stuff from database running in container:
  docker exec kword-db2 psql -U kword-user -d kword -c "SELECT count(*) from word" 2>&1
