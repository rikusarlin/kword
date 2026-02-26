import { useLocation, useNavigate } from 'react-router-dom';

interface Mistake {
  word_id: number;
  korean: string;
  english: string;
  question_type: string;
}

interface SessionResults {
  session_id: number;
  user_id: number;
  nickname: string;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds: number;
  accuracy: number;
  mistakes: Mistake[];
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get results from location state or fetch if needed
  const results = (location.state as { results?: SessionResults })?.results;
  
  if (!results) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Session Results</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-2 gap-4 text-center mb-6">
          <div>
            <p className="text-sm text-gray-500">Accuracy</p>
            <p className="text-3xl font-bold text-blue-600">{results.accuracy.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Correct Answers</p>
            <p className="text-3xl font-bold text-green-600">
              {results.correct_answers} / {results.total_questions}
            </p>
          </div>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-gray-700">Nickname: {results.nickname}</p>
        </div>
        
        {results.mistakes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Mistakes to Review</h3>
            <div className="space-y-2">
              {results.mistakes.map((mistake, index) => (
                <div key={index} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                  <p className="font-semibold">{mistake.korean}</p>
                  <p>Correct answer: {mistake.english}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button
          onClick={() => navigate('/high-scores')}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View High Scores
        </button>
      </div>
    </div>
  );
};

export default Results;
