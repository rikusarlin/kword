# K-word
This project is intented to train words in Korean for English speakers.

The main problem we are trying to address here is that Hangul words are difficult to remember.

The application should help me learn memorable rules for words.

We are interested in basic vocabulary, which you have in TOPIK-I-1671.pdf.

There should be questions of various types to keep user's interest up. See next section.

## Question types
There are a few types of questions:
- Korean - English. Show 5 words in Korean, user needs to combine Korean and English words.
    - Mixed, i.e all kinds of words
    - Verbs only. As above, but limit to verbs.
    - Adjectives only. As above, but limit to adjectives.
- Match Korean words with images of the words
- Ask questions like "What is the Hangul for 'apple'?"
- Select right Hangul word to a Hangul sentence, given 4 choices
- Previous mistakes - ask a word which we've had problems with before

## Requirements
- Ask 20 questions of different types per session
- Keep track of mistakes by word so we can do "Previous mistakes" types of questions.
- Ask for name or nickname in the beginning
- Store results in database (number and percentage of correct answers, total time)
- In the end, show a nickname's high scores and "global high scores". Top 10 will do.
