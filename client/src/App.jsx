import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ExploreDestinationsPage from './pages/ExploreDestinationsPage';
import CreateTripPage from './pages/CreateTripPage';
import TripDetailsPage from './pages/TripDetailsPage';
import JoinTripPage from './pages/JoinTripPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/destinations" element={<ExploreDestinationsPage />} />
            <Route path="/trips/new" element={<CreateTripPage />} />
            <Route path="/trips/:id" element={<TripDetailsPage />} />
            <Route path="/join/:code" element={<JoinTripPage />} />
            <Route path="/join" element={<JoinTripPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              TripMate &mdash; Student Semester Project &bull; DA-IICT Sem-3 Web Development
            </p>
            <p className="font-medium text-slate-600 dark:text-slate-300">
              Module 1 by Nishka Shah &bull; Module 2 (Part 1, 2 & 3) by Heer Shah
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
