import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { Score, User } from '../api/client';

function Leaderboard() {
  const [globalScores, setGlobalScores] = useState<Score[]>([]);
  const [userScores, setUserScores] = useState<Score[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'global' | 'personal'>('global');

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    setLoading(true);
    setError('');

    try {
      // Load global scores
      const global = await api.getGlobalScores();
      setGlobalScores(global);

      // Load user scores if user is logged in
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr) as User;
        setCurrentUser(user);
        const userScoresData = await api.getUserScores(user.id);
        setUserScores(userScoresData.scores);
      }
    } catch (err) {
      setError('Failed to load scores. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return <span className="text-gray-600 font-semibold">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Leaderboard 🏆
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 py-3 px-4 text-center font-semibold transition-colors ${
              activeTab === 'global'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Global Top 10
          </button>
          {currentUser && (
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 py-3 px-4 text-center font-semibold transition-colors ${
                activeTab === 'personal'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Top 10
            </button>
          )}
        </div>

        {/* Global Scores */}
        {activeTab === 'global' && (
          <div>
            {globalScores.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  No scores yet. Be the first to complete a quiz!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {globalScores.map((score, index) => (
                  <div
                    key={`${score.sessionId}-${index}`}
                    className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                      currentUser && score.nickname === currentUser.nickname
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center w-16">
                      {getRankBadge(score.rank)}
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {score.nickname || 'Anonymous'}
                            {currentUser && score.nickname === currentUser.nickname && (
                              <span className="ml-2 text-sm text-indigo-600">(You)</span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(score.completedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-6">
                            <div>
                              <p className="text-sm text-gray-600">Score</p>
                              <p className="text-2xl font-bold text-indigo-600">
                                {score.percentage}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Correct</p>
                              <p className="text-xl font-semibold text-green-600">
                                {score.correctAnswers}/{score.totalQuestions}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Time</p>
                              <p className="text-xl font-semibold text-blue-600">
                                {formatTime(score.totalTimeSeconds)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Personal Scores */}
        {activeTab === 'personal' && currentUser && (
          <div>
            {userScores.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  You haven't completed any quizzes yet. Start your first quiz to see your scores here!
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                  <h3 className="font-semibold text-indigo-900 mb-2">
                    Welcome back, {currentUser.nickname}!
                  </h3>
                  <p className="text-indigo-700">
                    You've completed {userScores.length} quiz{userScores.length !== 1 ? 'es' : ''}.
                    {userScores.length > 0 && (
                      <span>
                        {' '}Your best score is {Math.max(...userScores.map(s => s.percentage))}%!
                      </span>
                    )}
                  </p>
                </div>

                <div className="space-y-3">
                  {userScores.map((score, index) => (
                    <div
                      key={`${score.sessionId}-${index}`}
                      className="flex items-center p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-center justify-center w-16">
                        <span className="text-xl font-bold text-gray-700">#{index + 1}</span>
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">
                              Session #{score.sessionId}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(score.completedAt)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Score</p>
                              <p className="text-2xl font-bold text-indigo-600">
                                {score.percentage}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Correct</p>
                              <p className="text-xl font-semibold text-green-600">
                                {score.correctAnswers}/{score.totalQuestions}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Time</p>
                              <p className="text-xl font-semibold text-blue-600">
                                {formatTime(score.totalTimeSeconds)}
                              </p>
                            </div>
                            {score.rank && (
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Global Rank</p>
                                <p className="text-xl font-semibold text-purple-600">
                                  #{score.rank}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How Ranking Works</h4>
            <p className="text-blue-700 text-sm">
              Rankings are based on the percentage of correct answers, then by time taken.
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Improve Your Score</h4>
            <p className="text-green-700 text-sm">
              Practice regularly and review your mistakes to climb the leaderboard!
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Track Progress</h4>
            <p className="text-purple-700 text-sm">
              Your personal scores show your improvement over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
