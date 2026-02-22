import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Leaderboard from './pages/Leaderboard';
import Layout from './components/Layout';
function App() {
    return (_jsx(BrowserRouter, { children: _jsx(Routes, { children: _jsxs(Route, { path: "/", element: _jsx(Layout, {}), children: [_jsx(Route, { index: true, element: _jsx(Home, {}) }), _jsx(Route, { path: "quiz", element: _jsx(Quiz, {}) }), _jsx(Route, { path: "results/:sessionId", element: _jsx(Results, {}) }), _jsx(Route, { path: "leaderboard", element: _jsx(Leaderboard, {}) })] }) }) }));
}
export default App;
//# sourceMappingURL=App.js.map