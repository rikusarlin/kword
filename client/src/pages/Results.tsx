import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { SessionResult } from '../api/client';

function Results() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    loadResults();
  }, [sessionId, navigate, location.state]);

  const loadResults = async () => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    // Check if result was passed via navigation state
    const stateResult = location.state?.result as SessionResult | undefined;
    if (stateResult) {
      setResult(stateResult);
      setLoading(false);
      return;
    }

    // Otherwise, fetch from API
    try {
      const sessionResult = await api.getSessionResults(parseInt(sessionId));
      setResult(sessionResult);
      setLoading(false);
    } catch (err) {
      setError('Failed to load results');
      console.error(err);
      setLoading(false);
    }
  };

  const handleStartNewQuiz = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const session = await api.startSession(user.id);
      localStorage.setItem('session', JSON.stringify(session));
      navigate('/quiz');
    } catch (err) {
      setError('Failed to start new quiz');
      console.error(err);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPerformanceMessage = (percentage: number): { message: string; color: string } => {
    if (percentage >= 90) return { message: 'Excellent! 🎉', color: 'text-green-600' };
    if (percentage >= 75) return { message: 'Great job! 👍', color: 'text-blue-600' };
    if (percentage >= 60) return { message: 'Good effort! 💪', color: 'text-indigo-600' };
    if (percentage >= 50) return { message: 'Keep practicing! 📚', color: 'text-orange-600' };
    return { message: 'Don\'t give up! 🌟', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <p className="text-gray-600">No results found.</p>
        </div>
      </div>
    );
  }

  const performance = getPerformanceMessage(result.percentage);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
          <p className={`text-2xl font-semibold ${performance.color}`}>
            {performance.message}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Score card */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm uppercase tracking-wide mb-2">Score</p>
              <p className="text-5xl font-bold text-indigo-600">
                {result.percentage}%
              </p>
              <p className="text-gray-700 mt-2">
                {result.correctAnswers} / {result.totalQuestions} correct
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm uppercase tracking-wide mb-2">Time</p>
              <p className="text-5xl font-bold text-blue-600">
                {formatTime(result.totalTimeSeconds)}
              </p>
              <p className="text-gray-700 mt-2">Total time</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm uppercase tracking-wide mb-2">Accuracy</p>
              <p className="text-5xl font-bold text-green-600">
                {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
              </p>
              <p className="text-gray-700 mt-2">Correct answers</p>
            </div>
          </div>
        </div>

        {/* Performance breakdown */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Correct Answers</span>
                  <span className="text-sm font-medium text-gray-700">
                    {result.correctAnswers}/{result.totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Incorrect Answers</span>
                  <span className="text-sm font-medium text-gray-700">
                    {result.totalQuestions - result.correctAnswers}/{result.totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${100 - result.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Average Time per Question</h4>
            <p className="text-2xl font-bold text-blue-700">
              {Math.round(result.totalTimeSeconds / result.totalQuestions)}s
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Session ID</h4>
            <p className="text-2xl font-bold text-purple-700">#{sessionId}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleStartNewQuiz}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Start New Quiz
          </button>
          <Link
            to="/leaderboard"
            className="block w-full bg-white text-indigo-600 py-3 px-6 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors text-center"
          >
            View Leaderboard
          </Link>
          <Link
            to="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Results;
