import express from 'express';
import { startSession, submitAnswer, completeSession, getSessionResults, getMistakeHelp } from '../controllers/session.js';

const sessionRouter = express.Router();

// POST /api/sessions - Start a new session and get questions
sessionRouter.post('/', startSession);

// POST /api/sessions/:sessionId/answers - Submit an answer
sessionRouter.post('/:sessionId/answers', submitAnswer);

// POST /api/sessions/:sessionId/complete - Complete session
sessionRouter.post('/:sessionId/complete', completeSession);

// GET /api/sessions/:sessionId - Get session results
sessionRouter.get('/:sessionId', getSessionResults);

// GET /api/sessions/help/:wordId - Get help for a mistake
sessionRouter.get('/help/:wordId', getMistakeHelp);

export { sessionRouter };
