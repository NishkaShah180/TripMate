import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <Compass className="w-16 h-16 text-brand-600 mx-auto mb-4 animate-pulse" />
      <h1 className="text-3xl font-bold text-slate-900 mb-2">404</h1>
      <p className="text-slate-600 mb-6">Oops! The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
