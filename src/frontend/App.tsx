import { Routes, Route } from 'react-router-dom';
import NicknameInput from './components/NicknameInput';
import QuizSession from './components/QuizSession';
import Results from './components/Results';
import HighScores from './components/HighScores';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">K-word</h1>
          <div className="flex space-x-4">
            <a href="/" className="hover:text-blue-200">Home</a>
            <a href="/high-scores" className="hover:text-blue-200">High Scores</a>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<NicknameInput />} />
          <Route path="/quiz" element={<QuizSession />} />
          <Route path="/results/:sessionId" element={<Results />} />
          <Route path="/high-scores" element={<HighScores />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
