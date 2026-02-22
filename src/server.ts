import express from 'express';
import cors from 'cors';
import { userRouter } from './routes/user.js';
import { sessionRouter } from './routes/session.js';
import { scoreRouter } from './routes/score.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'K-word API is running' });
});

// API Routes
app.use('/api/users', userRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/scores', scoreRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 K-word API server running on port ${PORT}`);
  console.log(`📚 Ready to help you learn Korean vocabulary!`);
});

export { app };
