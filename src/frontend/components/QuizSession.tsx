import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Question {
  id: number;
  korean: string;
  english: string;
  part_of_speech: string;
  image_url?: string | null;
  memorable_rule?: string | null;
  question_type: 'matching' | 'sentence';
}
const QuizSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get user info from navigation state
  const { userId, nickname } = location.state || {};
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; selectedAnswer: string }[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      console.log(`selectionOption ${selectedOption}`)
      navigate('/');
      return;
    }
    
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create session');
        }
        
        const data = await response.json();
        setQuestions(data.questions || []);
      } catch (err) {
        setError('Failed to load questions. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [userId, navigate]);

  const handleAnswer = (wordId: number, answer: string) => {
    // Update answers array
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === wordId);
      if (existing) {
        return prev.map(a => 
          a.questionId === wordId ? { ...a, selectedAnswer: answer } : a
        );
      }
      return [...prev, { questionId: wordId, selectedAnswer: answer }];
    });
    
    setSelectedOption(answer);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Calculate time taken (simplified for now)
      const timeTaken = 0; // Will be implemented later
      
      const response = await fetch(`/api/sessions/${questions[0]?.id || 1}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers,
          time_taken_seconds: timeTaken
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit answers');
      }
      
      const data = await response.json();
      navigate(`/results/${data.session_id}`, { 
        state: { 
          results: data,
          userId,
          nickname,
          questions,
          answers
        } 
      });
    } catch (err) {
      setError('Failed to submit answers. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading questions...</p>
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

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No questions available.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Progress Bar */}
        <div className="mb-6 bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Question Header */}
          <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>User: {nickname}</span>
          </div>

          {/* Question Content */}
          <div className="mb-6">
            {currentQuestion.image_url && (
              <img 
                src={currentQuestion.image_url} 
                alt="Vocabulary image" 
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {currentQuestion.korean}
            </h2>
            
            <p className="text-gray-600 mb-4">
              Part of Speech: {currentQuestion.part_of_speech}
            </p>
            
            {currentQuestion.memorable_rule && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-4">
                <p className="text-yellow-700 font-medium">💡 Tip: {currentQuestion.memorable_rule}</p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => handleAnswer(q.id, q.english)}
                className={`w-full p-4 text-left rounded-lg transition-all ${
                  answers.find(a => a.questionId === q.id)?.selectedAnswer === q.english
                    ? 'bg-green-500 text-white shadow-lg transform scale-[1.02]'
                    : 'bg-gray-100 hover:bg-blue-50 text-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <span className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                    answers.find(a => a.questionId === q.id)?.selectedAnswer === q.english
                      ? 'border-white' : 'border-gray-400'
                  }`}>
                    {answers.find(a => a.questionId === q.id)?.selectedAnswer === q.english && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="font-medium">{q.english}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center">
            {currentQuestionIndex > 0 && (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
            )}
            
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 ml-auto transition-colors"
              >
                Next
              </button>
            ) : (
              <div className="ml-auto">
                <button
                  onClick={handleSubmit}
                  className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition-colors font-bold shadow-lg"
                >
                  Submit Answers
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSession;
