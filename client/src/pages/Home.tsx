import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

function Home() {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStartQuiz = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create or get user
      const user = await api.createOrGetUser(nickname.trim());

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));

      // Start session and navigate to quiz
      const session = await api.startSession(user.id);
      localStorage.setItem('session', JSON.stringify(session));

      navigate('/quiz');
    } catch (err) {
      setError('Failed to start quiz. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to K-word!
        </h2>
        <p className="text-xl text-gray-600">
          Master Korean vocabulary with interactive quizzes
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">
          Get Started
        </h3>
        <p className="text-gray-600 mb-6">
          Enter your nickname to begin your learning journey with 1670 TOPIK I vocabulary words!
        </p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleStartQuiz()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            onClick={handleStartQuiz}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting...' : 'Start Quiz'}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">20 Questions</h4>
            <p className="text-blue-700 text-sm">
              Each session includes 20 carefully selected questions
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Multiple Types</h4>
            <p className="text-green-700 text-sm">
              Matching, images, text input, and sentence completion
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Track Progress</h4>
            <p className="text-purple-700 text-sm">
              Review mistakes and see your improvement over time
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2">Compete</h4>
            <p className="text-orange-700 text-sm">
              Check the leaderboard and compete with others
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
