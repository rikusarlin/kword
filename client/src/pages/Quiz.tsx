import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Session } from '../api/client';

function Quiz() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [sessionStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Load session from localStorage
    const sessionStr = localStorage.getItem('session');
    if (!sessionStr) {
      navigate('/');
      return;
    }

    try {
      const loadedSession = JSON.parse(sessionStr) as Session;
      setSession(loadedSession);
      setQuestionStartTime(Date.now());
    } catch (err) {
      console.error('Failed to load session:', err);
      navigate('/');
    }
  }, [navigate]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime]);

  const currentQuestion = session?.questions[currentQuestionIndex];

  const handleAnswer = async () => {
    if (!session || !currentQuestion) return;

    setLoading(true);
    setError('');

    try {
      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
      let correct = false;

      // Determine if answer is correct based on question type
      correct = selectedAnswer === currentQuestion.wordId;

      setIsCorrect(correct);

      // Set the correct answer to display
      setCorrectAnswer(currentQuestion.correctAnswer || '');

      setShowFeedback(true);

      // Submit answer to backend
      await api.submitAnswer(session.sessionId, currentQuestion.wordId, correct, timeTaken);

      // Wait longer to show feedback and correct answer
      setTimeout(() => {
        setShowFeedback(false);
        setCorrectAnswer('');
        if (currentQuestionIndex < 19 && currentQuestionIndex < session.questions.length - 1) {
          // Move to next question (max 20 questions)
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSelectedAnswer(null);
          setQuestionStartTime(Date.now());
        } else {
          // Complete session and navigate to results
          completeSession();
        }
      }, 2500);
    } catch (err) {
      setError('Failed to submit answer. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const completeSession = async () => {
    if (!session) return;

    try {
      const result = await api.completeSession(session.sessionId);
      localStorage.removeItem('session');
      navigate(`/results/${session.sessionId}`, { state: { result } });
    } catch (err) {
      setError('Failed to complete session.');
      console.error(err);
    }
  };

  if (!session || !currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const isAnswerSelected = () => {
    return selectedAnswer !== null;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-xl p-8">
        {/* Progress indicator and timer */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {session.totalQuestions}</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(elapsedTime)}
              </span>
              <span>{Math.floor(((currentQuestionIndex + 1) / session.totalQuestions) * 100)}% Complete</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / session.totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Feedback message */}
        {showFeedback && (
          <div className={`mb-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-semibold text-lg mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            {!isCorrect && correctAnswer && (
              <p className="text-gray-700">
                The correct answer is: <span className="font-bold">{correctAnswer}</span>
              </p>
            )}
          </div>
        )}

        {/* Question content */}
        <div className="mb-8">
          {/* Korean-English Match */}
          {currentQuestion.type === 'korean_english_match' && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Match the Korean word
              </h3>
              <div className="bg-indigo-50 p-6 rounded-lg mb-6">
                <p className="text-4xl font-bold text-indigo-900 text-center">
                  {currentQuestion.korean}
                </p>
              </div>
              <p className="text-gray-600 mb-4">Select the correct English translation:</p>
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option.wordId}
                    onClick={() => setSelectedAnswer(option.wordId)}
                    disabled={loading || showFeedback}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswer === option.wordId
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 bg-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-lg">{option.english}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Match */}
          {currentQuestion.type === 'image_match' && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                What does this Korean word mean?
              </h3>
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <p className="text-5xl font-bold text-blue-900 text-center">
                  {currentQuestion.korean}
                </p>
              </div>
              <p className="text-gray-600 mb-4">Select the correct English meaning:</p>
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option.wordId}
                    onClick={() => setSelectedAnswer(option.wordId)}
                    disabled={loading || showFeedback}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswer === option.wordId
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-lg">{option.english}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sentence Completion (English to Korean) */}
          {currentQuestion.type === 'sentence_completion' && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Translate to Korean
              </h3>
              <div className="bg-purple-50 p-6 rounded-lg mb-6">
                <p className="text-3xl font-bold text-purple-900 text-center">
                  {currentQuestion.sentence}
                </p>
              </div>
              <p className="text-gray-600 mb-4">Select the correct Korean translation:</p>
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option.wordId}
                    onClick={() => setSelectedAnswer(option.wordId)}
                    disabled={loading || showFeedback}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswer === option.wordId
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-lg font-medium">{option.korean}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Previous Mistake */}
          {currentQuestion.type === 'previous_mistake' && (
            <div>
              <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-6">
                <p className="text-orange-800 font-semibold">
                  📚 Review: This is a word you got wrong before
                </p>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Match the Korean word
              </h3>
              <div className="bg-orange-50 p-6 rounded-lg mb-6">
                <p className="text-4xl font-bold text-orange-900 text-center">
                  {currentQuestion.korean}
                </p>
              </div>
              <p className="text-gray-600 mb-4">Select the correct English translation:</p>
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option.wordId}
                    onClick={() => setSelectedAnswer(option.wordId)}
                    disabled={loading || showFeedback}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswer === option.wordId
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 bg-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-lg">{option.english}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={handleAnswer}
          disabled={!isAnswerSelected() || loading || showFeedback}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : showFeedback ? 'Next...' : 'Submit Answer'}
        </button>
      </div>
    </div>
  );
}

export default Quiz;
