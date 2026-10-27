import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ExploreDestinationsPage from './pages/ExploreDestinationsPage';
import CreateTripPage from './pages/CreateTripPage';
import TripDetailsPage from './pages/TripDetailsPage';
import JoinTripPage from './pages/JoinTripPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
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
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            TripMate &mdash; Student Semester Project &bull; DA-IICT Sem-3 Web Development
          </p>
          <p className="font-medium text-slate-600">
            Module 1 by Nishka Shah &bull; Module 2 (Part 1) by Heer Shah
          </p>
        </div>
      </footer>
    </div>
  );
}
