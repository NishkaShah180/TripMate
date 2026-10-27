import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getTripById,
  addParticipant,
  removeParticipant,
  inviteParticipant,
} from '../services/tripService';
import {
  ArrowLeft,
  Users,
  PlusCircle,
  Copy,
  Check,
  Mail,
  Trash2,
  Calendar,
  MapPin,
  Share2,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  User,
} from 'lucide-react';

export default function TripDetailsPage() {
  const { id: tripId } = useParams();

  // Core Data
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state for modals and copy actions
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);
  const [operationError, setOperationError] = useState('');
  const [operationSuccess, setOperationSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [participantForm, setParticipantForm] = useState({
    name: '',
    email: '',
    role: 'member',
  });

  // Invite by email form state
  const [inviteEmailForm, setInviteEmailForm] = useState({
    name: '',
    email: '',
  });
  const [isInviting, setIsInviting] = useState(false);

  // Load trip data
  const loadTripData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getTripById(tripId);
      setTrip(res.trip);
    } catch (err) {
      setError(err.message || 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  // Copy helpers
  const handleCopyCode = () => {
    if (!trip?.inviteCode) return;
    navigator.clipboard.writeText(trip.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!trip?.inviteCode) return;
    const link = `${window.location.origin}/join/${trip.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Participant actions
  const handleAddParticipant = async (e) => {
    e.preventDefault();
    setOperationError('');
    setOperationSuccess('');

    if (!participantForm.name.trim()) {
      setOperationError('Participant name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addParticipant(tripId, participantForm);
      setTrip(res.trip);
      setParticipantForm({ name: '', email: '', role: 'member' });
      setShowAddParticipantModal(false);
      setOperationSuccess(`Participant "${res.participant.name}" added successfully.`);
      setTimeout(() => setOperationSuccess(''), 3000);
    } catch (err) {
      setOperationError(err.message || 'Failed to add participant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteByEmail = async (e) => {
    e.preventDefault();
    setOperationError('');
    setOperationSuccess('');

    if (!inviteEmailForm.name.trim() || !inviteEmailForm.email.trim()) {
      setOperationError('Both name and email are required to send an invitation');
      return;
    }

    setIsInviting(true);
    try {
      const res = await inviteParticipant(tripId, inviteEmailForm);
      setInviteEmailForm({ name: '', email: '' });
      await loadTripData();
      setOperationSuccess(`Invitation recorded for "${inviteEmailForm.name}". They can use code ${res.inviteCode} to join!`);
      setTimeout(() => setOperationSuccess(''), 4000);
    } catch (err) {
      setOperationError(err.message || 'Failed to generate invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveParticipant = async () => {
    if (!participantToDelete) return;
    setOperationError('');
    setIsSubmitting(true);
    try {
      const res = await removeParticipant(tripId, participantToDelete._id);
      setTrip(res.trip);
      setParticipantToDelete(null);
      setOperationSuccess('Participant removed successfully.');
      setTimeout(() => setOperationSuccess(''), 3000);
    } catch (err) {
      setOperationError(err.message || 'Cannot remove participant');
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading trip details and participants...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Trip Not Found</h2>
        <p className="text-sm text-slate-600 mb-6">{error || 'This trip does not exist.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Navigation & Back */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Operation Feedback Toast */}
      {operationSuccess && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{operationSuccess}</span>
        </div>
      )}

      {/* Trip Hero Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                <MapPin className="w-3.5 h-3.5" />
                <span>{trip.destination}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {formatDate(trip.startDate)} &mdash; {formatDate(trip.endDate)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Users className="w-3.5 h-3.5" />
                <span>{trip.participants?.length || 0} participants</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {trip.name}
            </h1>

            {trip.description && (
              <p className="text-sm text-slate-600 mt-2 max-w-2xl">{trip.description}</p>
            )}
          </div>

          {/* Quick Invite Code Box */}
          <div className="w-full md:w-auto bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Trip Invite Code
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-slate-900 px-3 py-1 bg-white border border-slate-200 rounded-lg">
                {trip.inviteCode || 'N/A'}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-brand-600 hover:bg-slate-50 transition"
                title="Copy Invite Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 transition text-xs font-semibold"
                title="Copy shareable link to join"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied Link!' : 'Share Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Invitations & Add Participant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column: Shareable Invitations & Invite Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Shareable Invite Card */}
          <div className="bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Trip Invitations</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Share the unique code or direct link with friends so they can join this trip immediately.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-brand-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Code:</span>
                <span className="font-mono text-sm font-bold text-brand-700">
                  {trip.inviteCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 text-slate-400 hover:text-brand-600 transition"
                  title="Copy code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-200" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Shareable Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick Invite by Email Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">Send Invitation</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Record an invite for a participant. They will appear as "Invited" until they join.
            </p>

            <form onSubmit={handleInviteByEmail} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Friend's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aman Verma"
                  value={inviteEmailForm.name}
                  onChange={(e) => setInviteEmailForm({ ...inviteEmailForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-100 focus:border-brand-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Friend's Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. aman@example.com"
                  value={inviteEmailForm.email}
                  onChange={(e) => setInviteEmailForm({ ...inviteEmailForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-100 focus:border-brand-600 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isInviting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-60"
              >
                {isInviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Record Invitation</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Participants List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Trip Participants</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage the confirmed travelers and invited friends for this trip.
                </p>
              </div>
              <button
                onClick={() => {
                  setOperationError('');
                  setShowAddParticipantModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Participant</span>
              </button>
            </div>

            {trip.participants?.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-700">No participants yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Add friends to the trip or share the invite code above so they can join!
                </p>
                <button
                  onClick={() => setShowAddParticipantModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add First Participant</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {trip.participants?.map((participant) => {
                  const initials = participant.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={participant._id}
                      className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">
                              {participant.name}
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                participant.role === 'organizer'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {participant.role}
                            </span>
                            {participant.status === 'invited' && (
                              <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                Invited
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {participant.email || 'No email provided'} &bull; Joined{' '}
                            {formatDate(participant.joinedAt)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setOperationError('');
                          setParticipantToDelete(participant);
                        }}
                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition"
                        title="Remove participant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Participant */}
      {showAddParticipantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setShowAddParticipantModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Add Trip Participant</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Add a traveler directly into this trip's member directory.
            </p>

            {operationError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{operationError}</span>
              </div>
            )}

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nishka Shah"
                  value={participantForm.name}
                  onChange={(e) =>
                    setParticipantForm({ ...participantForm, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. nishka@example.com"
                  value={participantForm.email}
                  onChange={(e) =>
                    setParticipantForm({ ...participantForm, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={participantForm.role}
                  onChange={(e) =>
                    setParticipantForm({ ...participantForm, role: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-600 focus:outline-none bg-white"
                >
                  <option value="member">Trip Member</option>
                  <option value="organizer">Trip Organizer</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddParticipantModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition shadow-sm disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add Participant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Remove Participant Confirmation */}
      {participantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl relative">
            <h3 className="text-base font-bold text-slate-900">Remove Participant</h3>
            <p className="text-xs text-slate-600 mt-2">
              Are you sure you want to remove <strong className="text-slate-800">"{participantToDelete.name}"</strong> from this trip?
            </p>

            {operationError && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-800 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{operationError}</span>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setParticipantToDelete(null);
                  setOperationError('');
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRemoveParticipant}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-sm"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
