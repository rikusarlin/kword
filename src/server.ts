import express, { Request, Response } from 'express';
import { db } from './db'
import { sql } from 'kysely'

const app = express();
const port = 3001;

app.use(express.json());

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const result = await db
      .selectFrom('user')
      .select('id')
      .limit(1)
      .execute()
    res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: (error as Error).message
    })
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
