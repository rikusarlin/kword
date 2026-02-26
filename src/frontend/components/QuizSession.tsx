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

interface Card {
  id: string;
  questionId: number;
  text: string;
  isKorean: boolean;
}

interface SessionResponse {
  session_id: number;
  questions: Question[];
}

interface SubmitAnswersRequest {
  answers: { questionId: number; selectedAnswer: string }[];
  time_taken_seconds: number;
}

interface SubmitAnswersResponse {
  session_id: number;
  correct_answers: number;
  total_questions: number;
  accuracy: number;
}

const QuizSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get user info from navigation state
  const { userId, nickname } = location.state || {};
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentMatchingIndex, setCurrentMatchingIndex] = useState(0);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [answers, setAnswers] = useState<{ questionId: number; selectedAnswer: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
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
        
        const data: SessionResponse = await response.json();
        // Sort questions: matching first, then sentence
        const sortedQuestions = [...(data.questions || [])].sort((a, b) => {
          if (a.question_type === 'matching' && b.question_type !== 'matching') return -1;
          if (a.question_type !== 'matching' && b.question_type === 'matching') return 1;
          return 0;
        });
        
        setQuestions(sortedQuestions);
        setSessionId(data.session_id);
      } catch (err) {
        setError('Failed to load questions. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [userId, navigate]);

  // Get matching questions
  const matchingQuestions = questions.filter(q => q.question_type === 'matching');
  const sentenceQuestions = questions.filter(q => q.question_type === 'sentence');
  
  // Create cards for matching (Korean and English versions)
  const createMatchingDeck = () => {
    // Get current set of matching questions (4 cards at a time)
    const startIndex = currentMatchingIndex;
    const endIndex = Math.min(startIndex + 4, matchingQuestions.length);
    const currentSet = matchingQuestions.slice(startIndex, endIndex);
    
    // Create cards: one Korean and one English for each question
    const deck: Card[] = [];
    currentSet.forEach((question, index) => {
      // Korean card
      deck.push({
        id: `k-${question.id}`,
        questionId: question.id,
        text: question.korean,
        isKorean: true
      });
      
      // English card
      deck.push({
        id: `e-${question.id}`,
        questionId: question.id,
        text: question.english,
        isKorean: false
      });
    });
    
    // Sort the deck: Korean cards first, then English cards
    return deck.sort((a, b) => {
      if (a.isKorean && !b.isKorean) return -1;
      if (!a.isKorean && b.isKorean) return 1;
      return 0;
    });
  };
  
  const currentDeck = createMatchingDeck();
  
  const isMatchingPhase = currentMatchingIndex < matchingQuestions.length;
  const currentQuestion = isMatchingPhase 
    ? matchingQuestions[currentMatchingIndex] 
    : sentenceQuestions[currentMatchingIndex - matchingQuestions.length];

  const handleCardClick = (card: Card) => {
    // Skip if already matched or selected
    if (matchedPairs.includes(card.questionId)) return;
    if (selectedCards.some(c => c.id === card.id)) return;
    
    // Add to selection
    const newSelection = [...selectedCards, card];
    setSelectedCards(newSelection);
    
    // Check if we have 2 cards selected
    if (newSelection.length === 2) {
      // Check if they match (same questionId but different card id)
      const [first, second] = newSelection;
      
      if (first.questionId === second.questionId && first.id !== second.id) {
        // Match found
        setMatchedPairs(prev => [...prev, first.questionId]);
        setSelectedCards([]);
        
        // Record the answer - always use the English translation as the selected answer
        setAnswers(prev => {
          const existing = prev.find(a => a.questionId === first.questionId);
          if (!existing) {
            // Find the English card to get the correct answer
            const englishCard = newSelection.find(c => !c.isKorean);
            return [...prev, { questionId: first.questionId, selectedAnswer: englishCard?.text || '' }];
          }
          return prev;
        });
      } else {
        // No match - record mistake for both cards and show error briefly then clear selection
        if (sessionId) {
          // Record the mistake for both cards - only when they don't match
          const mistakePromises = [first, second].map(card => 
            fetch('/api/mistakes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                wordId: card.questionId
              })
            }).catch(err => {
              console.error('Failed to record mistake:', err);
            })
          );
          
          // Wait for mistakes to be recorded
          Promise.all(mistakePromises).then(() => {
            setTimeout(() => setSelectedCards([]), 500);
          });
        } else {
          setTimeout(() => setSelectedCards([]), 500);
        }
      }
    }
    
    // Move to next question if we've completed a pair
    if (selectedCards.length === 1 && newSelection.length === 2) {
      // Completed a pair
      if (currentMatchingIndex % 4 === 1 || currentMatchingIndex % 4 === 3) {
        setCurrentMatchingIndex(prev => prev + 1);
      }
    } else if (newSelection.length === 0 && selectedCards.length > 0) {
      // Cleared selection
      if (currentMatchingIndex % 4 === 2 || currentMatchingIndex % 4 === 3) {
        setCurrentMatchingIndex(prev => prev + 1);
      }
    }
  };

  const handleSentenceAnswer = (wordId: number, answer: string) => {
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
    
    // Check if this is a mistake
    const currentQuestion = questions.find(q => q.id === wordId);
    if (currentQuestion && answer !== currentQuestion.english) {
      // Record mistake
      if (sessionId) {
        fetch('/api/mistakes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            wordId
          })
        }).catch(err => {
          console.error('Failed to record mistake:', err);
        });
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Calculate time taken (simplified for now)
      const timeTaken = 0; // Will be implemented later
      
      if (!sessionId) {
        throw new Error('Session ID not available');
      }
      
      const response = await fetch(`/api/sessions/${sessionId}/answers`, {
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
      
      const data: SubmitAnswersResponse = await response.json();
      
      // Navigate to results page with session data
      navigate(`/results/${data.session_id}`, { 
        state: { 
          results: {
            session_id: data.session_id,
            correct_answers: data.correct_answers,
            total_questions: data.total_questions,
            accuracy: data.accuracy
          },
          userId,
          nickname,
          questions,
          answers
        } 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answers. Please try again.');
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
  
  if (isMatchingPhase) {
    // Calculate which set of 4 cards we're on
    const matchingSetIndex = Math.floor(currentMatchingIndex / 2);
    const currentMatchingSet = matchingQuestions.slice(
      matchingSetIndex * 4, 
      (matchingSetIndex + 1) * 4
    );
    
    // Check if we've completed all matching questions
    if (matchingSetIndex >= Math.ceil(matchingQuestions.length / 2)) {
      // Move to sentence questions
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            {/* Progress Bar */}
            <div className="mb-6 bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${(matchingQuestions.length / questions.length) * 100}%` 
                }}
              ></div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              {/* Question Header */}
              <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                <span>Question {matchingQuestions.length + 1} of {questions.length}</span>
                <span>User: {nickname}</span>
              </div>

              {/* Sentence Questions */}
              {sentenceQuestions.map((q, index) => (
                <div key={q.id} className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">Sentence {index + 1}</h3>
                  <div className="bg-blue-50 p-4 rounded-lg mb-2">
                    {/* Simplified sentence display - you can enhance this */}
                    <p className="text-gray-800">{q.korean}</p>
                  </div>
                  
                  <div className="space-y-2">
                    {questions.filter(otherQ => otherQ.id !== q.id && otherQ.part_of_speech === q.part_of_speech).slice(0, 4).map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleSentenceAnswer(q.id, option.english)}
                        className={`w-full p-3 text-left rounded-lg transition-all ${
                          answers.find(a => a.questionId === q.id)?.selectedAnswer === option.english
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-gray-100 hover:bg-blue-50 text-gray-800'
                        }`}
                      >
                        {option.english}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Navigation */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSubmit}
                  className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition-colors font-bold shadow-lg"
                >
                  Submit Answers
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Progress Bar */}
          <div className="mb-6 bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 ease-out"
              style={{ 
                width: `${((currentMatchingIndex + 1) / (matchingQuestions.length || 1)) * 100}%` 
              }}
            ></div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            {/* Question Header */}
            <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
              <span>Matching {Math.floor(currentMatchingIndex / 2) + 1}</span>
              <span>User: {nickname}</span>
            </div>

            {/* Matching Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {currentDeck.map((card) => {
                const isSelected = selectedCards.some(c => c.id === card.id);
                const isMatched = matchedPairs.includes(card.questionId);
                
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    disabled={isMatched || selectedCards.length >= 2}
                    className={`p-6 rounded-xl transition-all ${
                      isMatched
                        ? 'bg-green-500 text-white shadow-lg'
                        : isSelected
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 hover:bg-blue-50 text-gray-800'
                    }`}
                  >
                    <div className="text-center">
                      {card.isKorean && matchingQuestions.find(q => q.id === card.questionId)?.image_url && (
                        <img 
                          src={matchingQuestions.find(q => q.id === card.questionId)!.image_url!} 
                          alt="Vocabulary image" 
                          className="w-full h-32 object-cover rounded-lg mb-4"
                        />
                      )}
                      
                      <h3 className="text-xl font-bold">{card.text}</h3>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Instructions */}
            <div className="text-center mb-6">
              {selectedCards.length === 0 && (
                <p className="text-gray-600">Click on a card to select it</p>
              )}
              {selectedCards.length === 1 && (
                <p className="text-blue-600 font-medium">Now click on the matching word</p>
              )}
              {selectedCards.length === 2 && (
                <p className="text-gray-600">Checking match...</p>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-8 flex justify-between items-center">
              {currentMatchingIndex > 0 && (
                <button
                  onClick={() => setCurrentMatchingIndex(prev => prev - 1)}
                  className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
              )}
              
              {currentMatchingIndex < matchingQuestions.length - 4 ? (
                <button
                  onClick={() => setCurrentMatchingIndex(prev => prev + 4)}
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
  }

  // Sentence questions view
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Progress Bar */}
        <div className="mb-6 bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 ease-out"
            style={{ 
              width: `${((matchingQuestions.length + (currentMatchingIndex - matchingQuestions.length) + 1) / questions.length) * 100}%` 
            }}
          ></div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Question Header */}
          <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
            <span>Question {currentMatchingIndex + 1} of {questions.length}</span>
            <span>User: {nickname}</span>
          </div>

          {/* Sentence Questions */}
          {sentenceQuestions.map((q, index) => (
            <div key={q.id} className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Sentence {index + 1}</h3>
              <div className="bg-blue-50 p-4 rounded-lg mb-2">
                {/* Simplified sentence display - you can enhance this */}
                <p className="text-gray-800">{q.korean}</p>
              </div>
              
              <div className="space-y-2">
                {questions.filter(otherQ => otherQ.id !== q.id && otherQ.part_of_speech === q.part_of_speech).slice(0, 4).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSentenceAnswer(q.id, option.english)}
                    className={`w-full p-3 text-left rounded-lg transition-all ${
                      answers.find(a => a.questionId === q.id)?.selectedAnswer === option.english
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-gray-100 hover:bg-blue-50 text-gray-800'
                    }`}
                  >
                    {option.english}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Navigation */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 transition-colors font-bold shadow-lg"
            >
              Submit Answers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSession;
