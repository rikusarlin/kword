import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        }
        catch (err) {
            setError('Failed to start quiz. Please try again.');
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto px-4 py-12", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Welcome to K-word!" }), _jsx("p", { className: "text-xl text-gray-600", children: "Master Korean vocabulary with interactive quizzes" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-xl p-8", children: [_jsx("h3", { className: "text-2xl font-semibold text-gray-900 mb-6", children: "Get Started" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Enter your nickname to begin your learning journey with 1670 TOPIK I vocabulary words!" }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "text", placeholder: "Enter your nickname", value: nickname, onChange: (e) => setNickname(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleStartQuiz(), className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent", disabled: loading }), error && _jsx("p", { className: "text-red-600 text-sm", children: error }), _jsx("button", { onClick: handleStartQuiz, disabled: loading, className: "w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed", children: loading ? 'Starting...' : 'Start Quiz' })] }), _jsxs("div", { className: "mt-8 grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-blue-900 mb-2", children: "20 Questions" }), _jsx("p", { className: "text-blue-700 text-sm", children: "Each session includes 20 carefully selected questions" })] }), _jsxs("div", { className: "bg-green-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-green-900 mb-2", children: "Multiple Types" }), _jsx("p", { className: "text-green-700 text-sm", children: "Matching, images, text input, and sentence completion" })] }), _jsxs("div", { className: "bg-purple-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-purple-900 mb-2", children: "Track Progress" }), _jsx("p", { className: "text-purple-700 text-sm", children: "Review mistakes and see your improvement over time" })] }), _jsxs("div", { className: "bg-orange-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-orange-900 mb-2", children: "Compete" }), _jsx("p", { className: "text-orange-700 text-sm", children: "Check the leaderboard and compete with others" })] })] })] })] }));
}
export default Home;
//# sourceMappingURL=Home.js.map