import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllTrips, joinTripByCode } from '../services/tripService';
import {
  PlusCircle,
  Compass,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  KeyRound,
  Loader2,
  X,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();

  // Trips state
  const [trips, setTrips] = useState([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [tripsError, setTripsError] = useState('');

  // Backend Health state
  const [backendStatus, setBackendStatus] = useState({
    loading: true,
    connected: false,
    message: '',
  });

  // Join Trip modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinForm, setJoinForm] = useState({ inviteCode: '', name: '', email: '' });
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

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

  const loadTrips = async () => {
    setIsLoadingTrips(true);
    setTripsError('');
    try {
      const data = await getAllTrips();
      setTrips(data.trips || []);
    } catch (err) {
      setTripsError(err.message || 'Failed to load trips');
    } finally {
      setIsLoadingTrips(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    loadTrips();
  }, []);

  const handleJoinTrip = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!joinForm.inviteCode.trim() || !joinForm.name.trim()) {
      setJoinError('Invite code and your name are required.');
      return;
    }

    setJoinLoading(true);
    try {
      const result = await joinTripByCode(joinForm);
      setShowJoinModal(false);
      setJoinForm({ inviteCode: '', name: '', email: '' });
      navigate(`/trips/${result.tripId}`);
    } catch (err) {
      setJoinError(err.message || 'Could not join trip. Please verify the invite code.');
    } finally {
      setJoinLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const computeDays = (start, end) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Backend Health Badge */}
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
                {backendStatus.loading ? 'Checking...' : backendStatus.connected ? 'Connected (MERN Active)' : 'Offline / Error'}
              </span>
            </p>
            {backendStatus.message && (
              <p className="text-xs text-slate-500">{backendStatus.message}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            checkBackendHealth();
            loadTrips();
          }}
          className="text-xs font-medium text-slate-600 hover:text-brand-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition"
        >
          Retest Connection & Refresh
        </button>
      </div>

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Trips</h1>
          <p className="text-sm text-slate-600 mt-1">
            Organize trips, manage participants, and share invitations in one place.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition shadow-sm text-sm"
          >
            <KeyRound className="w-4 h-4 text-brand-600" />
            <span>Join with Code</span>
          </button>
          <Link
            to="/trips/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition shadow-sm text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Trip</span>
          </Link>
        </div>
      </div>

      {/* Trips Content */}
      {isLoadingTrips ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Loading your trips...</p>
        </div>
      ) : tripsError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="font-semibold text-sm">{tripsError}</p>
          <button
            onClick={loadTrips}
            className="mt-3 text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      ) : trips.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No trips planned yet</h2>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
            Start planning your next adventure. Create your trip, invite friends with a code, and manage travelers together.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/trips/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition text-sm shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Your First Trip</span>
            </Link>
            <button
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition text-sm"
            >
              <KeyRound className="w-4 h-4 text-brand-600" />
              <span>Join with Invite Code</span>
            </button>
          </div>
        </div>
      ) : (
        /* Trip Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const days = computeDays(trip.startDate, trip.endDate);

            return (
              <div
                key={trip._id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" />
                      <span className="truncate max-w-[150px]">{trip.destination}</span>
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {trip.inviteCode || 'N/A'}
                    </span>
                  </div>

                  <Link to={`/trips/${trip._id}`} className="block">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition line-clamp-1 mb-1">
                      {trip.name}
                    </h3>
                  </Link>

                  {trip.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                      {trip.description}
                    </p>
                  )}

                  {/* Dates & Duration */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </span>
                    <span className="ml-auto text-slate-400 font-medium">({days}d)</span>
                  </div>

                  {/* Participants Pill */}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium text-slate-700">
                      {trip.participantCount} {trip.participantCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>

                {/* Card Footer / Action */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Invite Code: <strong className="text-slate-800 font-mono">{trip.inviteCode}</strong>
                  </span>
                  <Link
                    to={`/trips/${trip._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
                  >
                    <span>Manage Participants</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join Trip Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => {
                setShowJoinModal(false);
                setJoinError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Join a Trip</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Enter the 6-character trip invite code shared by the trip organizer.
            </p>

            {joinError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{joinError}</span>
              </div>
            )}

            <form onSubmit={handleJoinTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Invite Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRIP-7X9K2L"
                  value={joinForm.inviteCode}
                  onChange={(e) => setJoinForm({ ...joinForm, inviteCode: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-brand-100 focus:border-brand-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Heer Shah"
                  value={joinForm.name}
                  onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your Email <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. heer@example.com"
                  value={joinForm.email}
                  onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition shadow-sm disabled:opacity-60"
                >
                  {joinLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Join Trip</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
