const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const api = {
    async createOrGetUser(nickname) {
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
    async startSession(userId) {
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
    async submitAnswer(sessionId, wordId, isCorrect, timeTakenSeconds) {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wordId, isCorrect, timeTakenSeconds }),
        });
        if (!response.ok) {
            throw new Error('Failed to submit answer');
        }
    },
    async completeSession(sessionId) {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            throw new Error('Failed to complete session');
        }
        return response.json();
    },
    async getGlobalScores() {
        const response = await fetch(`${API_BASE_URL}/api/scores/global`);
        if (!response.ok) {
            throw new Error('Failed to get global scores');
        }
        const data = await response.json();
        return data.scores;
    },
    async getUserScores(userId) {
        const response = await fetch(`${API_BASE_URL}/api/scores/user/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to get user scores');
        }
        return response.json();
    },
    async getMistakeHelp(wordId) {
        const response = await fetch(`${API_BASE_URL}/api/sessions/help/${wordId}`);
        if (!response.ok) {
            throw new Error('Failed to get mistake help');
        }
        return response.json();
    },
};
//# sourceMappingURL=client.js.map