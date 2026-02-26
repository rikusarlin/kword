import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ResultsData {
  session_id: number;
  correct_answers: number;
  total_questions: number;
  accuracy: number;
}

interface ResultsState {
  results: ResultsData;
  userId: number;
  nickname: string;
  questions: Array<{
    id: number;
    korean: string;
    english: string;
    part_of_speech: string;
    image_url?: string | null;
    memorable_rule?: string | null;
    question_type: 'matching' | 'sentence';
  }>;
  answers: Array<{ questionId: number; selectedAnswer: string }>;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get results data from navigation state
  const { results, userId, nickname, questions, answers } = (location.state as ResultsState) || {};

  const [mistakes, setMistakes] = useState<Array<{
    id: number;
    word_id: number;
    korean: string;
    english: string;
    memorable_rule: string;
  }>>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!results || !userId) {
      navigate('/');
      return;
    }

    const fetchMistakes = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/users/${userId}/mistakes`);
        if (!response.ok) {
          throw new Error('Failed to fetch mistakes');
        }

        const data = await response.json();
        setMistakes(data.mistakes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch mistakes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMistakes();
  }, [results, userId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const accuracy = results?.accuracy || 0;
  const correctAnswers = results?.correct_answers || 0;
  const totalQuestions = results?.total_questions || 0;

  // Determine performance message
  let performanceMessage = '';
  if (accuracy >= 90) {
    performanceMessage = 'Excellent work! 🌟';
  } else if (accuracy >= 70) {
    performanceMessage = 'Great job! 👍';
  } else if (accuracy >= 50) {
    performanceMessage = 'Good effort! 📚';
  } else {
    performanceMessage = 'Keep practicing! 💪';
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Results</h1>
          <p className="text-gray-600">{nickname}, you're doing great!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Accuracy</h3>
            <p className="text-4xl font-bold text-blue-600 mt-2">{accuracy.toFixed(1)}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Correct</h3>
            <p className="text-4xl font-bold text-green-600 mt-2">{correctAnswers}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total</h3>
            <p className="text-4xl font-bold text-purple-600 mt-2">{totalQuestions}</p>
          </div>
        </div>

        {/* Performance Message */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 text-center">
          <h2 className="text-2xl font-bold text-white">{performanceMessage}</h2>
          <p className="text-blue-100 mt-2">Keep up the good work!</p>
        </div>

        {/* Mistakes Section */}
        {mistakes.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Mistakes</h2>
            
            <div className="space-y-4">
              {mistakes.map((mistake) => (
                <div key={mistake.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{mistake.korean}</h3>
                      <p className="text-red-600 font-medium">Correct answer: {mistake.english}</p>
                      
                      {mistake.memorable_rule && (
                        <div className="mt-2 bg-yellow-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800">Memorable Rule:</p>
                          <p className="text-sm text-yellow-700">{mistake.memorable_rule}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-lg"
          >
            Home
          </button>
          
          <button
            onClick={() => navigate('/quiz')}
            className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition-colors font-bold shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
