import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTripPreviewByCode, joinTripByCode } from '../services/tripService';
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  KeyRound,
  User,
  Mail,
} from 'lucide-react';

export default function JoinTripPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [inviteCode, setInviteCode] = useState(code || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [tripPreview, setTripPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  // Fetch trip preview when code is present
  const fetchPreview = async (cleanCode) => {
    if (!cleanCode || !cleanCode.trim()) return;
    setLoadingPreview(true);
    setPreviewError('');
    try {
      const res = await getTripPreviewByCode(cleanCode.trim());
      setTripPreview(res.trip);
    } catch (err) {
      setPreviewError(err.message || 'Invalid or expired invite code');
      setTripPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (code) {
      setInviteCode(code.toUpperCase());
      fetchPreview(code.toUpperCase());
    }
  }, [code]);

  const handleCodeBlur = () => {
    if (inviteCode && (!tripPreview || tripPreview.inviteCode !== inviteCode.trim().toUpperCase())) {
      fetchPreview(inviteCode.trim().toUpperCase());
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!inviteCode.trim()) {
      setSubmitError('Invite code is required');
      return;
    }
    if (!name.trim()) {
      setSubmitError('Your name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await joinTripByCode({
        inviteCode: inviteCode.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim(),
      });

      setJoinedSuccess(true);
      setTimeout(() => {
        navigate(`/trips/${result.tripId}`);
      }, 1200);
    } catch (err) {
      setSubmitError(err.message || 'Failed to join trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Join a Trip</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 mb-6">
          Enter your invite code and your details to join your group's travel workspace.
        </p>

        {/* Success Banner */}
        {joinedSuccess && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Joined successfully!</p>
              <p className="text-xs text-emerald-700">Redirecting to trip workspace...</p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {submitError && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-xs font-medium">{submitError}</p>
          </div>
        )}

        {/* Trip Preview Card if Code Validated */}
        {loadingPreview ? (
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Checking invite code...</p>
          </div>
        ) : previewError ? (
          <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{previewError}</span>
          </div>
        ) : tripPreview ? (
          <div className="mb-6 p-4 rounded-2xl bg-brand-50/60 border border-brand-200">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-700 block mb-1">
              You are invited to join
            </span>
            <h3 className="text-base font-bold text-slate-900">{tripPreview.name}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                {tripPreview.destination}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {formatDate(tripPreview.startDate)} - {formatDate(tripPreview.endDate)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                {tripPreview.participantCount} members
              </span>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trip Invite Code <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. TRIP-7X9K2L"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onBlur={handleCodeBlur}
                className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-brand-100 focus:border-brand-600 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => fetchPreview(inviteCode.trim().toUpperCase())}
                className="absolute right-2 top-2 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Verify
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. Heer Shah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Email Address <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                placeholder="e.g. heer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || joinedSuccess}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Joining Trip...</span>
                </>
              ) : (
                <span>Join Trip</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
