import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Compass, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState({
    loading: true,
    connected: false,
    message: '',
  });

  const checkBackendHealth = async () => {
    setBackendStatus({ loading: true, connected: false, message: '' });
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBackendStatus({
        loading: false,
        connected: true,
        message: data.message || 'Backend is reachable',
      });
    } catch (err) {
      setBackendStatus({
        loading: false,
        connected: false,
        message: err.message || 'Cannot reach backend server',
      });
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stage 1 Health Badge */}
      <div className="mb-6 p-4 rounded-xl border bg-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {backendStatus.loading ? (
            <RefreshCw className="w-5 h-5 text-brand-600 animate-spin" />
          ) : backendStatus.connected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500" />
          )}
          <div>
            <p className="text-sm font-medium text-slate-900">
              Backend Status:{' '}
              <span className={backendStatus.connected ? 'text-emerald-600 font-semibold' : 'text-slate-600'}>
                {backendStatus.loading ? 'Checking...' : backendStatus.connected ? 'Connected' : 'Offline / Error'}
              </span>
            </p>
            {backendStatus.message && (
              <p className="text-xs text-slate-500">{backendStatus.message}</p>
            )}
          </div>
        </div>
        <button
          onClick={checkBackendHealth}
          className="text-xs font-medium text-slate-600 hover:text-brand-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition"
        >
          Retest Connection
        </button>
      </div>

      {/* Hero / Overview Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Trips</h1>
          <p className="text-sm text-slate-600 mt-1">
            Organize, plan, and manage all your upcoming adventures in one place.
          </p>
        </div>
        <Link
          to="/trips/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition shadow-sm text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Trip</span>
        </Link>
      </div>

      {/* Initial Empty State / Shell */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">No trips planned yet</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
          Start planning your next getaway. Explore popular destinations or jump straight into creating your custom itinerary.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/trips/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition text-sm shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Your First Trip</span>
          </Link>
          <Link
            to="/destinations"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition text-sm"
          >
            <span>Explore Destinations</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
