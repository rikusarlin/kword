import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../api/client';
function Leaderboard() {
    const [globalScores, setGlobalScores] = useState([]);
    const [userScores, setUserScores] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('global');
    useEffect(() => {
        loadScores();
    }, []);
    const loadScores = async () => {
        setLoading(true);
        setError('');
        try {
            // Load global scores
            const global = await api.getGlobalScores();
            setGlobalScores(global);
            // Load user scores if user is logged in
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                const userScoresData = await api.getUserScores(user.id);
                setUserScores(userScoresData.scores);
            }
        }
        catch (err) {
            setError('Failed to load scores. Please try again.');
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getRankBadge = (rank) => {
        switch (rank) {
            case 1:
                return _jsx("span", { className: "text-2xl", children: "\uD83E\uDD47" });
            case 2:
                return _jsx("span", { className: "text-2xl", children: "\uD83E\uDD48" });
            case 3:
                return _jsx("span", { className: "text-2xl", children: "\uD83E\uDD49" });
            default:
                return _jsxs("span", { className: "text-gray-600 font-semibold", children: ["#", rank] });
        }
    };
    if (loading) {
        return (_jsx("div", { className: "max-w-6xl mx-auto px-4 py-12", children: _jsx("div", { className: "bg-white rounded-lg shadow-xl p-8", children: _jsx("p", { className: "text-gray-600", children: "Loading leaderboard..." }) }) }));
    }
    return (_jsx("div", { className: "max-w-6xl mx-auto px-4 py-12", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl p-8", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-6 text-center", children: "Leaderboard \uD83C\uDFC6" }), error && (_jsx("div", { className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg", children: _jsx("p", { className: "text-red-600", children: error }) })), _jsxs("div", { className: "flex border-b border-gray-200 mb-6", children: [_jsx("button", { onClick: () => setActiveTab('global'), className: `flex-1 py-3 px-4 text-center font-semibold transition-colors ${activeTab === 'global'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-600 hover:text-gray-900'}`, children: "Global Top 10" }), currentUser && (_jsx("button", { onClick: () => setActiveTab('personal'), className: `flex-1 py-3 px-4 text-center font-semibold transition-colors ${activeTab === 'personal'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-600 hover:text-gray-900'}`, children: "My Top 10" }))] }), activeTab === 'global' && (_jsx("div", { children: globalScores.length === 0 ? (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-600 text-lg", children: "No scores yet. Be the first to complete a quiz!" }) })) : (_jsx("div", { className: "space-y-3", children: globalScores.map((score, index) => (_jsxs("div", { className: `flex items-center p-4 rounded-lg border-2 transition-all ${currentUser && score.nickname === currentUser.nickname
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'}`, children: [_jsx("div", { className: "flex items-center justify-center w-16", children: getRankBadge(score.rank) }), _jsx("div", { className: "flex-1 ml-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-semibold text-lg text-gray-900", children: [score.nickname || 'Anonymous', currentUser && score.nickname === currentUser.nickname && (_jsx("span", { className: "ml-2 text-sm text-indigo-600", children: "(You)" }))] }), _jsx("p", { className: "text-sm text-gray-600", children: formatDate(score.completedAt) })] }), _jsx("div", { className: "text-right", children: _jsxs("div", { className: "flex items-center space-x-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Score" }), _jsxs("p", { className: "text-2xl font-bold text-indigo-600", children: [score.percentage, "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Correct" }), _jsxs("p", { className: "text-xl font-semibold text-green-600", children: [score.correctAnswers, "/", score.totalQuestions] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Time" }), _jsx("p", { className: "text-xl font-semibold text-blue-600", children: formatTime(score.totalTimeSeconds) })] })] }) })] }) })] }, `${score.sessionId}-${index}`))) })) })), activeTab === 'personal' && currentUser && (_jsx("div", { children: userScores.length === 0 ? (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-600 text-lg", children: "You haven't completed any quizzes yet. Start your first quiz to see your scores here!" }) })) : (_jsxs("div", { children: [_jsxs("div", { className: "mb-6 p-4 bg-indigo-50 rounded-lg", children: [_jsxs("h3", { className: "font-semibold text-indigo-900 mb-2", children: ["Welcome back, ", currentUser.nickname, "!"] }), _jsxs("p", { className: "text-indigo-700", children: ["You've completed ", userScores.length, " quiz", userScores.length !== 1 ? 'es' : '', ".", userScores.length > 0 && (_jsxs("span", { children: [' ', "Your best score is ", Math.max(...userScores.map(s => s.percentage)), "%!"] }))] })] }), _jsx("div", { className: "space-y-3", children: userScores.map((score, index) => (_jsxs("div", { className: "flex items-center p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-indigo-300 transition-all", children: [_jsx("div", { className: "flex items-center justify-center w-16", children: _jsxs("span", { className: "text-xl font-bold text-gray-700", children: ["#", index + 1] }) }), _jsx("div", { className: "flex-1 ml-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Session #", score.sessionId] }), _jsx("p", { className: "text-sm text-gray-500", children: formatDate(score.completedAt) })] }), _jsxs("div", { className: "flex items-center space-x-6", children: [_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Score" }), _jsxs("p", { className: "text-2xl font-bold text-indigo-600", children: [score.percentage, "%"] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Correct" }), _jsxs("p", { className: "text-xl font-semibold text-green-600", children: [score.correctAnswers, "/", score.totalQuestions] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Time" }), _jsx("p", { className: "text-xl font-semibold text-blue-600", children: formatTime(score.totalTimeSeconds) })] }), score.rank && (_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Global Rank" }), _jsxs("p", { className: "text-xl font-semibold text-purple-600", children: ["#", score.rank] })] }))] })] }) })] }, `${score.sessionId}-${index}`))) })] })) })), _jsxs("div", { className: "mt-8 grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-blue-900 mb-2", children: "How Ranking Works" }), _jsx("p", { className: "text-blue-700 text-sm", children: "Rankings are based on the percentage of correct answers, then by time taken." })] }), _jsxs("div", { className: "bg-green-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-green-900 mb-2", children: "Improve Your Score" }), _jsx("p", { className: "text-green-700 text-sm", children: "Practice regularly and review your mistakes to climb the leaderboard!" })] }), _jsxs("div", { className: "bg-purple-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-purple-900 mb-2", children: "Track Progress" }), _jsx("p", { className: "text-purple-700 text-sm", children: "Your personal scores show your improvement over time." })] })] })] }) }));
}
export default Leaderboard;
//# sourceMappingURL=Leaderboard.js.map