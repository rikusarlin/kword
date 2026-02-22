# K-word
This project is intented to train words in Korean for English speakers.

The main problem we are trying to address here is that Hangul words are difficult to remember.

The application should help me learn memorable rules for words. If user makes a mistake, try to propse a rule that could help user remember the word.

We are interested in basic vocabulary, which you have in TOPIK-I-1671.pdf.

There should be questions of various types to keep user's interest up. See next section.

## Question types
There are a few types of questions:
- Korean - English. Show 5 words in Korean, user needs to combine Korean and English words. Use like 10/20 of these.
- Select right Hangul word to a Hangul sentence, given 4 choices. Use like 6/20 ohese.
- Previous mistakes - ask a word which we've had problems with before. Use 4/20 of these. A correct answer to a previous mistake zeroes the counter, ie. the word is no longer a "mistake word" until a mistake is again made.

## Requirements
- Ask 20 questions of different types per session
- Keep track of mistakes by word so we can do "Previous mistakes" types of questions.
- Ask for name or nickname in the beginning
- Store results in database (number and percentage of correct answers, total time)
- In the end, show a nickname's high scores and "global high scores". Top 10 will do.
