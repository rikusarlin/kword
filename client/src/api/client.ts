const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type User = {
  id: number;
  nickname: string;
  created_at: string;
};

export type Question = {
  id: string;
  type: string;
  wordId: number;
  korean?: string;
  english?: string;
  options?: Array<{ korean: string; english: string; wordId: number }>;
  sentence?: string;
  correctAnswer?: string;
};

export type Session = {
  sessionId: number;
  questions: Question[];
  totalQuestions: number;
};

export type SessionResult = {
  sessionId: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  totalTimeSeconds: number;
};

export type Score = {
  rank: number;
  nickname?: string;
  sessionId?: number;
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  totalTimeSeconds: number;
  completedAt: string | null;
};

export const api = {
  async createOrGetUser(nickname: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });

    if (!response.ok) {
      throw new Error('Failed to create or get user');
    }

    const data = await response.json();
    return data.user;
  },

  async startSession(userId: number): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to start session');
    }

    return response.json();
  },

  async submitAnswer(
    sessionId: number,
    wordId: number,
    isCorrect: boolean,
    timeTakenSeconds: number
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId, isCorrect, timeTakenSeconds }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit answer');
    }
  },

  async completeSession(sessionId: number): Promise<SessionResult> {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to complete session');
    }

    return response.json();
  },

  async getSessionResults(sessionId: number): Promise<SessionResult> {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);

    if (!response.ok) {
      throw new Error('Failed to get session results');
    }

    return response.json();
  },

  async getGlobalScores(): Promise<Score[]> {
    const response = await fetch(`${API_BASE_URL}/api/scores/global`);

    if (!response.ok) {
      throw new Error('Failed to get global scores');
    }

    const data = await response.json();
    return data.scores;
  },

  async getUserScores(userId: number): Promise<{ user: User; scores: Score[] }> {
    const response = await fetch(`${API_BASE_URL}/api/scores/user/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to get user scores');
    }

    return response.json();
  },

  async getMistakeHelp(wordId: number): Promise<{ word: { korean: string; english: string }; tips: string[] }> {
    const response = await fetch(`${API_BASE_URL}/api/sessions/help/${wordId}`);

    if (!response.ok) {
      throw new Error('Failed to get mistake help');
    }

    return response.json();
  },
};
