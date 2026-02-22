import express from 'express';
import { getHighScores, getUserScores } from '../controllers/score.js';

const scoreRouter = express.Router();

// GET /api/scores/global - Get global top 10 high scores
scoreRouter.get('/global', getHighScores);

// GET /api/scores/user/:userId - Get user's top 10 scores
scoreRouter.get('/user/:userId', getUserScores);

export { scoreRouter };
