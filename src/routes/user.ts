import express from 'express';
import { createOrGetUser } from '../controllers/user.js';

const userRouter = express.Router();

// POST /api/users - Create or get user by nickname
userRouter.post('/', createOrGetUser);

export { userRouter };
