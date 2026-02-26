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

interface SessionState {
  userId: number;
  nickname: string;
}

const QuizSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ word_id: number; answer: string }[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Get user info from location state
  const userId = (location.state as SessionState)?.userId;
  
  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create session');
        }
        
        const data = await response.json();
        setQuestions(data.questions);
        setLoading(false);
      } catch (err) {
        console.error(err);
        alert('Failed to load questions. Please try again.');
        navigate('/');
      }
    };
    
    fetchQuestions();
  }, [userId, navigate]);
  
  const handleAnswer = (wordId: number, answer: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.word_id === wordId);
      if (existing) {
        return prev.map(a => 
          a.word_id === wordId ? { ...a, answer } : a
        );
      }
      return [...prev, { word_id: wordId, answer }];
    });
  };
  
  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/sessions/${answers.length > 0 ? answers[0].word_id : 1}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers,
          time_taken_seconds: 0 // Will be implemented later
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit answers');
      }
      
      const data = await response.json();
      navigate(`/results/${data.session_id}`, { state: { results: data } });
    } catch (err) {
      console.error(err);
      alert('Failed to submit answers. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!sessionStarted) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Ready to start?</h2>
        <p className="mb-4">
          You'll be answering 20 questions covering vocabulary matching and sentence completion.
        </p>
        <button
          onClick={() => setSessionStarted(true)}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Quiz
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Question {currentQuestionIndex + 1} of {questions.length}</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        {questions[currentQuestionIndex]?.question_type === 'matching' && (
          <div className="mb-4">
            {questions[currentQuestionIndex]?.image_url ? (
              <img 
                src={questions[currentQuestionIndex].image_url} 
                alt="Vocabulary image" 
                className="max-h-48 mx-auto mb-4 rounded-lg"
              />
            ) : null}
            
            <h3 className="text-xl font-semibold mb-2">
              {questions[currentQuestionIndex]?.korean}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              {questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleAnswer(q.id, q.english)}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    answers.find(a => a.word_id === q.id)?.answer === q.english
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'border border-gray-300 hover:bg-blue-50'
                  }`}
                >
                  {q.english}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {questions[currentQuestionIndex]?.question_type === 'sentence' && (
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Complete the sentence:</h3>
            <p className="text-lg mb-4">
              {questions[currentQuestionIndex]?.memorable_rule || 
               questions[currentQuestionIndex]?.korean.replace('___', '_____')}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              {questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleAnswer(q.id, q.english)}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    answers.find(a => a.word_id === q.id)?.answer === q.english
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'border border-gray-300 hover:bg-blue-50'
                  }`}
                >
                  {q.english}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        {currentQuestionIndex > 0 && (
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
          >
            Previous
          </button>
        )}
        
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 ml-auto"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 ml-auto"
          >
            Submit Answers
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizSession;
