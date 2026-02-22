import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
function Quiz() {
    const [session, setSession] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const navigate = useNavigate();
    useEffect(() => {
        // Load session from localStorage
        const sessionStr = localStorage.getItem('session');
        if (!sessionStr) {
            navigate('/');
            return;
        }
        try {
            const loadedSession = JSON.parse(sessionStr);
            setSession(loadedSession);
            setQuestionStartTime(Date.now());
        }
        catch (err) {
            console.error('Failed to load session:', err);
            navigate('/');
        }
    }, [navigate]);
    const currentQuestion = session?.questions[currentQuestionIndex];
    const handleAnswer = async () => {
        if (!session || !currentQuestion)
            return;
        setLoading(true);
        setError('');
        try {
            const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
            let correct = false;
            // Determine if answer is correct based on question type
            switch (currentQuestion.type) {
                case 'korean_english_match':
                case 'image_match':
                case 'sentence_completion':
                case 'previous_mistake':
                    correct = selectedAnswer === currentQuestion.wordId;
                    break;
                case 'text_input':
                    correct = textInput.trim().toLowerCase() === currentQuestion.korean?.toLowerCase();
                    break;
            }
            setIsCorrect(correct);
            // Set the correct answer to display
            if (currentQuestion.type === 'text_input') {
                setCorrectAnswer(currentQuestion.korean || '');
            }
            else {
                setCorrectAnswer(currentQuestion.correctAnswer || '');
            }
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
                    setTextInput('');
                    setQuestionStartTime(Date.now());
                }
                else {
                    // Complete session and navigate to results
                    completeSession();
                }
            }, 2500);
        }
        catch (err) {
            setError('Failed to submit answer. Please try again.');
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const completeSession = async () => {
        if (!session)
            return;
        try {
            await api.completeSession(session.sessionId);
            localStorage.removeItem('session');
            navigate(`/results/${session.sessionId}`);
        }
        catch (err) {
            setError('Failed to complete session.');
            console.error(err);
        }
    };
    if (!session || !currentQuestion) {
        return (_jsx("div", { className: "max-w-4xl mx-auto px-4 py-12", children: _jsx("div", { className: "bg-white rounded-lg shadow-xl p-8", children: _jsx("p", { className: "text-gray-600", children: "Loading quiz..." }) }) }));
    }
    const isAnswerSelected = () => {
        if (currentQuestion.type === 'text_input') {
            return textInput.trim().length > 0;
        }
        return selectedAnswer !== null;
    };
    return (_jsx("div", { className: "max-w-4xl mx-auto px-4 py-12", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl p-8", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex justify-between text-sm text-gray-600 mb-2", children: [_jsxs("span", { children: ["Question ", currentQuestionIndex + 1, " of ", session.totalQuestions] }), _jsxs("span", { children: [Math.floor(((currentQuestionIndex + 1) / session.totalQuestions) * 100), "% Complete"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-indigo-600 h-2 rounded-full transition-all duration-300", style: { width: `${((currentQuestionIndex + 1) / session.totalQuestions) * 100}%` } }) })] }), error && (_jsx("div", { className: "mb-4 p-4 bg-red-50 border border-red-200 rounded-lg", children: _jsx("p", { className: "text-red-600", children: error }) })), showFeedback && (_jsxs("div", { className: `mb-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`, children: [_jsx("p", { className: `font-semibold text-lg mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`, children: isCorrect ? '✓ Correct!' : '✗ Incorrect' }), !isCorrect && correctAnswer && (_jsxs("p", { className: "text-gray-700", children: ["The correct answer is: ", _jsx("span", { className: "font-bold", children: correctAnswer })] }))] })), _jsxs("div", { className: "mb-8", children: [currentQuestion.type === 'korean_english_match' && (_jsxs("div", { children: [_jsx("h3", { className: "text-2xl font-semibold text-gray-900 mb-2", children: "Match the Korean word" }), _jsx("div", { className: "bg-indigo-50 p-6 rounded-lg mb-6", children: _jsx("p", { className: "text-4xl font-bold text-indigo-900 text-center", children: currentQuestion.korean }) }), _jsx("p", { className: "text-gray-600 mb-4", children: "Select the correct English translation:" }), _jsx("div", { className: "space-y-3", children: currentQuestion.options?.map((option) => (_jsx("button", { onClick: () => setSelectedAnswer(option.wordId), disabled: loading || showFeedback, className: `w-full p-4 text-left rounded-lg border-2 transition-all ${selectedAnswer === option.wordId
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-gray-200 hover:border-indigo-300 bg-white'} disabled:opacity-50 disabled:cursor-not-allowed`, children: _jsx("span", { className: "text-lg", children: option.english }) }, option.wordId))) })] })), currentQuestion.type === 'image_match' && (_jsxs("div", { children: [_jsx("h3", { className: "text-2xl font-semibold text-gray-900 mb-2", children: "What does this Korean word mean?" }), _jsx("div", { className: "bg-blue-50 p-6 rounded-lg mb-6", children: _jsx("p", { className: "text-5xl font-bold text-blue-900 text-center", children: currentQuestion.korean }) }), _jsx("p", { className: "text-gray-600 mb-4", children: "Select the correct English meaning:" }), _jsx("div", { className: "space-y-3", children: currentQuestion.options?.map((option) => (_jsx("button", { onClick: () => setSelectedAnswer(option.wordId), disabled: loading || showFeedback, className: `w-full p-4 text-left rounded-lg border-2 transition-all ${selectedAnswer === option.wordId
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300 bg-white'} disabled:opacity-50 disabled:cursor-not-allowed`, children: _jsx("span", { className: "text-lg", children: option.english }) }, option.wordId))) })] })), currentQuestion.type === 'text_input' && (_jsxs("div", { children: [_jsx("h3", { className: "text-2xl font-semibold text-gray-900 mb-2", children: "Write the Korean word" }), _jsx("div", { className: "bg-green-50 p-6 rounded-lg mb-6", children: _jsx("p", { className: "text-2xl text-green-900 text-center", children: currentQuestion.english }) }), _jsx("p", { className: "text-gray-600 mb-4", children: "Type the Korean translation:" }), _jsx("input", { type: "text", value: textInput, onChange: (e) => setTextInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && isAnswerSelected() && !loading && !showFeedback && handleAnswer(), placeholder: "Enter Korean word", disabled: loading || showFeedback, className: "w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50", autoFocus: true })] })), currentQuestion.type === 'sentence_completion' && (_jsxs("div", { children: [_jsx("h3", { className: "text-2xl font-semibold text-gray-900 mb-2", children: "Complete the sentence" }), _jsx("div", { className: "bg-purple-50 p-6 rounded-lg mb-6", children: _jsx("p", { className: "text-xl text-purple-900", children: currentQuestion.sentence }) }), _jsx("p", { className: "text-gray-600 mb-4", children: "Select the Korean word that completes the sentence:" }), _jsx("div", { className: "space-y-3", children: currentQuestion.options?.map((option) => (_jsx("button", { onClick: () => setSelectedAnswer(option.wordId), disabled: loading || showFeedback, className: `w-full p-4 text-left rounded-lg border-2 transition-all ${selectedAnswer === option.wordId
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-gray-200 hover:border-purple-300 bg-white'} disabled:opacity-50 disabled:cursor-not-allowed`, children: _jsx("span", { className: "text-lg font-medium", children: option.korean }) }, option.wordId))) })] })), currentQuestion.type === 'previous_mistake' && (_jsxs("div", { children: [_jsx("div", { className: "bg-orange-100 border-l-4 border-orange-500 p-4 mb-6", children: _jsx("p", { className: "text-orange-800 font-semibold", children: "\uD83D\uDCDA Review: This is a word you got wrong before" }) }), _jsx("h3", { className: "text-2xl font-semibold text-gray-900 mb-2", children: "Match the Korean word" }), _jsx("div", { className: "bg-orange-50 p-6 rounded-lg mb-6", children: _jsx("p", { className: "text-4xl font-bold text-orange-900 text-center", children: currentQuestion.korean }) }), _jsx("p", { className: "text-gray-600 mb-4", children: "Select the correct English translation:" }), _jsx("div", { className: "space-y-3", children: currentQuestion.options?.map((option) => (_jsx("button", { onClick: () => setSelectedAnswer(option.wordId), disabled: loading || showFeedback, className: `w-full p-4 text-left rounded-lg border-2 transition-all ${selectedAnswer === option.wordId
                                            ? 'border-orange-600 bg-orange-50'
                                            : 'border-gray-200 hover:border-orange-300 bg-white'} disabled:opacity-50 disabled:cursor-not-allowed`, children: _jsx("span", { className: "text-lg", children: option.english }) }, option.wordId))) })] }))] }), _jsx("button", { onClick: handleAnswer, disabled: !isAnswerSelected() || loading || showFeedback, className: "w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed", children: loading ? 'Submitting...' : showFeedback ? 'Next...' : 'Submit Answer' })] }) }));
}
export default Quiz;
//# sourceMappingURL=Quiz.js.map