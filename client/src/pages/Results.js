import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
function Results() {
    const { sessionId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    useEffect(() => {
        if (!sessionId) {
            navigate('/');
            return;
        }
        loadResults();
    }, [sessionId, navigate]);
    const loadResults = async () => {
        try {
            // For now, we'll create a mock result since the backend complete endpoint
            // returns the result directly. In a real app, we might want a separate
            // endpoint to fetch results by session ID.
            // Check if we have user data to start a new session
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                navigate('/');
                return;
            }
            // Since we complete the session in Quiz component and it returns the result,
            // we don't have it here. We could either:
            // 1. Pass it through navigation state
            // 2. Store it in localStorage temporarily
            // 3. Create a new API endpoint to fetch session results
            // For now, let's show a success message and stats would come from a future endpoint
            setLoading(false);
        }
        catch (err) {
            setError('Failed to load results');
            console.error(err);
            setLoading(false);
        }
    };
    const handleStartNewQuiz = async () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            navigate('/');
            return;
        }
        try {
            const user = JSON.parse(userStr);
            const session = await api.startSession(user.id);
            localStorage.setItem('session', JSON.stringify(session));
            navigate('/quiz');
        }
        catch (err) {
            setError('Failed to start new quiz');
            console.error(err);
        }
    };
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    const getPerformanceMessage = (percentage) => {
        if (percentage >= 90)
            return { message: 'Excellent! 🎉', color: 'text-green-600' };
        if (percentage >= 75)
            return { message: 'Great job! 👍', color: 'text-blue-600' };
        if (percentage >= 60)
            return { message: 'Good effort! 💪', color: 'text-indigo-600' };
        if (percentage >= 50)
            return { message: 'Keep practicing! 📚', color: 'text-orange-600' };
        return { message: 'Don\'t give up! 🌟', color: 'text-red-600' };
    };
    if (loading) {
        return (_jsx("div", { className: "max-w-4xl mx-auto px-4 py-12", children: _jsx("div", { className: "bg-white rounded-lg shadow-xl p-8", children: _jsx("p", { className: "text-gray-600", children: "Loading results..." }) }) }));
    }
    // Temporary mock data until we implement proper result fetching
    // In production, this would come from the API
    const mockResult = {
        sessionId: parseInt(sessionId || '0'),
        totalQuestions: 20,
        correctAnswers: 15,
        percentage: 75,
        totalTimeSeconds: 180,
    };
    const performance = getPerformanceMessage(mockResult.percentage);
    return (_jsx("div", { className: "max-w-4xl mx-auto px-4 py-12", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-2", children: "Quiz Complete!" }), _jsx("p", { className: `text-2xl font-semibold ${performance.color}`, children: performance.message })] }), error && (_jsx("div", { className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg", children: _jsx("p", { className: "text-red-600", children: error }) })), _jsx("div", { className: "bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-8 mb-8", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-600 text-sm uppercase tracking-wide mb-2", children: "Score" }), _jsxs("p", { className: "text-5xl font-bold text-indigo-600", children: [mockResult.percentage, "%"] }), _jsxs("p", { className: "text-gray-700 mt-2", children: [mockResult.correctAnswers, " / ", mockResult.totalQuestions, " correct"] })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-600 text-sm uppercase tracking-wide mb-2", children: "Time" }), _jsx("p", { className: "text-5xl font-bold text-blue-600", children: formatTime(mockResult.totalTimeSeconds) }), _jsx("p", { className: "text-gray-700 mt-2", children: "Total time" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-600 text-sm uppercase tracking-wide mb-2", children: "Accuracy" }), _jsxs("p", { className: "text-5xl font-bold text-green-600", children: [Math.round((mockResult.correctAnswers / mockResult.totalQuestions) * 100), "%"] }), _jsx("p", { className: "text-gray-700 mt-2", children: "Correct answers" })] })] }) }), _jsxs("div", { className: "mb-8", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Performance Breakdown" }), _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "flex items-center", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex justify-between mb-1", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Correct Answers" }), _jsxs("span", { className: "text-sm font-medium text-gray-700", children: [mockResult.correctAnswers, "/", mockResult.totalQuestions] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full", style: { width: `${mockResult.percentage}%` } }) })] }) }), _jsx("div", { className: "flex items-center", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex justify-between mb-1", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Incorrect Answers" }), _jsxs("span", { className: "text-sm font-medium text-gray-700", children: [mockResult.totalQuestions - mockResult.correctAnswers, "/", mockResult.totalQuestions] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-red-500 h-2 rounded-full", style: { width: `${100 - mockResult.percentage}%` } }) })] }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-8", children: [_jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-blue-900 mb-2", children: "Average Time per Question" }), _jsxs("p", { className: "text-2xl font-bold text-blue-700", children: [Math.round(mockResult.totalTimeSeconds / mockResult.totalQuestions), "s"] })] }), _jsxs("div", { className: "bg-purple-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-purple-900 mb-2", children: "Session ID" }), _jsxs("p", { className: "text-2xl font-bold text-purple-700", children: ["#", sessionId] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: handleStartNewQuiz, className: "w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors", children: "Start New Quiz" }), _jsx(Link, { to: "/leaderboard", className: "block w-full bg-white text-indigo-600 py-3 px-6 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors text-center", children: "View Leaderboard" }), _jsx(Link, { to: "/", className: "block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center", children: "Back to Home" })] }), _jsx("div", { className: "mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg", children: _jsxs("p", { className: "text-sm text-yellow-800", children: [_jsx("strong", { children: "Note:" }), " Detailed results fetching will be implemented in Phase 6. Currently showing session completion confirmation."] }) })] }) }));
}
export default Results;
//# sourceMappingURL=Results.js.map