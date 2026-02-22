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
    options?: Array<{
        korean: string;
        english: string;
        wordId: number;
    }>;
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
export declare const api: {
    createOrGetUser(nickname: string): Promise<User>;
    startSession(userId: number): Promise<Session>;
    submitAnswer(sessionId: number, wordId: number, isCorrect: boolean, timeTakenSeconds: number): Promise<void>;
    completeSession(sessionId: number): Promise<SessionResult>;
    getGlobalScores(): Promise<Score[]>;
    getUserScores(userId: number): Promise<{
        user: User;
        scores: Score[];
    }>;
    getMistakeHelp(wordId: number): Promise<{
        word: {
            korean: string;
            english: string;
        };
        tips: string[];
    }>;
};
//# sourceMappingURL=client.d.ts.map