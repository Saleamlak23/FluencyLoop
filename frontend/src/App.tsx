// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import PracticePage from "./pages/PracticePage";
import SpeakingPage from "./pages/SpeakingPage";
import WritingPage from "./pages/WritingPage";
import WordOfTheDayPage from "./pages/WordOfTheDayPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes with shared layout (header + sidebar) */}
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/speaking" element={<SpeakingPage />} />
          <Route path="/writing" element={<WritingPage />} />
          <Route path="/word-of-the-day" element={<WordOfTheDayPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}