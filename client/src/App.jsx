import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ExploreDestinationsPage from './pages/ExploreDestinationsPage';
import CreateTripPage from './pages/CreateTripPage';
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>TripMate &mdash; Student Semester Project | Module 1 by Nishka Shah</p>
        </div>
      </footer>
    </div>
  );
}
