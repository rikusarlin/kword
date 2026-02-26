import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HighScore {
  id: number;
  user_id: number;
  nickname: string;
  total_sessions: number;
  average_accuracy: number;
  best_session_accuracy: number;
}

const HighScores = () => {
  const [globalTop10, setGlobalTop10] = useState<HighScore[]>([]);
  const [personalScores, setPersonalScores] = useState<HighScore[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGlobalScores = async () => {
      try {
        setLoading(true);
        
        // Fetch global top 10
        const globalResponse = await fetch('/api/high-scores');
        if (globalResponse.ok) {
          const globalData = await globalResponse.json();
          setGlobalTop10(globalData.global_top_10 || []);
        }
        
        // For demo purposes, we'll use a hardcoded user ID
        const userId = localStorage.getItem('userId');
        if (userId) {
          const personalResponse = await fetch(`/api/users/${userId}/high-scores`);
          if (personalResponse.ok) {
            const personalData = await personalResponse.json();
            setPersonalScores(personalData.personal_high_scores || []);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching high scores:', err);
        setLoading(false);
      }
    };
    
    fetchGlobalScores();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">High Scores</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-4">Global Top 10</h3>
        {globalTop10.length === 0 ? (
          <p>No scores yet. Be the first!</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Rank</th>
                <th className="p-2 text-left">Nickname</th>
                <th className="p-2 text-right">Best Accuracy</th>
                <th className="p-2 text-right">Total Sessions</th>
              </tr>
            </thead>
            <tbody>
              {globalTop10.map((score, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 font-semibold">{score.nickname}</td>
                  <td className="p-2 text-right">{score.best_session_accuracy.toFixed(1)}%</td>
                  <td className="p-2 text-right">{score.total_sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {personalScores.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Your High Scores</h3>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-right">Accuracy</th>
                <th className="p-2 text-right">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {personalScores.map((score, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2 text-right">{score.average_accuracy.toFixed(1)}%</td>
                  <td className="p-2 text-right">{score.total_sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mt-6"
      >
        Back to Home
      </button>
    </div>
  );
};

export default HighScores;
