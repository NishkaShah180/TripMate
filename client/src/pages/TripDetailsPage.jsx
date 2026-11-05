import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getTripById,
  updateTrip,
  addParticipant,
  updateParticipant,
  removeParticipant,
  inviteParticipant,
  getTripItinerary,
  addActivity,
  updateActivity,
  deleteActivity,
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
  Edit3,
  Compass,
  FileText,
  Search,
  ShieldCheck,
  UserCheck,
  Clock,
  CalendarDays,
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

  // Participant search and role filter state
  const [participantSearch, setParticipantSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'organizer' | 'member'

  // Edit Trip modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Itinerary state (Module 1 - Part 3 / Stage 4)
  const [selectedDay, setSelectedDay] = useState('all'); // 'all' or 'YYYY-MM-DD'
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null); // null when adding
  const [activityForm, setActivityForm] = useState({
    title: '',
    date: '',
    startTime: '',
    location: '',
    notes: '',
  });
  const [activityFieldErrors, setActivityFieldErrors] = useState({});
  const [activityError, setActivityError] = useState('');
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

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

  // Date conversion helper for HTML date input
  const toDateInputValue = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  // Open Edit Modal with prefilled data
  const handleOpenEditModal = () => {
    if (!trip) return;
    setEditForm({
      name: trip.name || '',
      destination: trip.destination || '',
      startDate: toDateInputValue(trip.startDate),
      endDate: toDateInputValue(trip.endDate),
      description: trip.description || '',
    });
    setEditFieldErrors({});
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (editFieldErrors[name]) {
      setEditFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    if (editError) setEditError('');
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editForm.name.trim()) {
      errors.name = 'Trip name is required';
    }
    if (!editForm.destination.trim()) {
      errors.destination = 'Destination is required';
    }
    if (!editForm.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (!editForm.endDate) {
      errors.endDate = 'End date is required';
    } else if (editForm.startDate && editForm.endDate < editForm.startDate) {
      errors.endDate = 'End date cannot be earlier than start date';
    }

    setEditFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateTrip = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!validateEditForm()) {
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await updateTrip(tripId, {
        name: editForm.name.trim(),
        destination: editForm.destination.trim(),
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        description: editForm.description.trim(),
      });
      setTrip(res.trip);
      setShowEditModal(false);
      setOperationSuccess('Trip details updated successfully.');
      setTimeout(() => setOperationSuccess(''), 3000);
    } catch (err) {
      setEditError(err.message || 'Failed to update trip details.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Itinerary helper: calculate all days between trip.startDate and trip.endDate
  const tripDays = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return [];
    const days = [];
    const startStr = toDateInputValue(trip.startDate);
    const endStr = toDateInputValue(trip.endDate);
    if (!startStr || !endStr) return [];

    const cur = new Date(startStr + 'T00:00:00');
    const last = new Date(endStr + 'T00:00:00');
    let dayNum = 1;

    while (cur <= last && dayNum <= 365) {
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const formatted = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({
        dayNumber: dayNum,
        dateKey,
        label: `Day ${dayNum}`,
        displayDate: formatted,
      });
      cur.setDate(cur.getDate() + 1);
      dayNum++;
    }
    return days;
  }, [trip?.startDate, trip?.endDate]);

  // Chronologically sorted activities
  const sortedActivities = useMemo(() => {
    const list = [...(trip?.itinerary || [])];
    return list.sort((a, b) => {
      const aDateStr = toDateInputValue(a.date);
      const bDateStr = toDateInputValue(b.date);
      if (aDateStr !== bDateStr) {
        return aDateStr.localeCompare(bDateStr);
      }
      const aHasTime = Boolean(a.startTime && a.startTime.trim());
      const bHasTime = Boolean(b.startTime && b.startTime.trim());
      if (aHasTime && !bHasTime) return -1;
      if (!aHasTime && bHasTime) return 1;
      if (aHasTime && bHasTime) {
        return a.startTime.trim().localeCompare(b.startTime.trim());
      }
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });
  }, [trip?.itinerary]);

  // Filtered activities based on selected day ('all' or 'YYYY-MM-DD')
  const displayedActivities = useMemo(() => {
    if (selectedDay === 'all') return sortedActivities;
    return sortedActivities.filter((act) => toDateInputValue(act.date) === selectedDay);
  }, [sortedActivities, selectedDay]);

  // Itinerary modal actions
  const handleOpenAddActivityModal = (prefillDate = null) => {
    const defaultDate = prefillDate || (selectedDay !== 'all' ? selectedDay : toDateInputValue(trip.startDate));
    setEditingActivity(null);
    setActivityForm({
      title: '',
      date: defaultDate || '',
      startTime: '',
      location: '',
      notes: '',
    });
    setActivityFieldErrors({});
    setActivityError('');
    setShowActivityModal(true);
  };

  const handleOpenEditActivityModal = (activity) => {
    setEditingActivity(activity);
    setActivityForm({
      title: activity.title || '',
      date: toDateInputValue(activity.date),
      startTime: activity.startTime || '',
      location: activity.location || '',
      notes: activity.notes || '',
    });
    setActivityFieldErrors({});
    setActivityError('');
    setShowActivityModal(true);
  };

  const handleActivityFormChange = (e) => {
    const { name, value } = e.target;
    setActivityForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (activityFieldErrors[name]) {
      setActivityFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    if (activityError) setActivityError('');
  };

  const validateActivityForm = () => {
    const errors = {};
    if (!activityForm.title.trim()) {
      errors.title = 'Activity title is required';
    }
    if (!activityForm.date) {
      errors.date = 'Activity date is required';
    } else {
      const tripStartStr = toDateInputValue(trip.startDate);
      const tripEndStr = toDateInputValue(trip.endDate);
      if (activityForm.date < tripStartStr) {
        errors.date = `Date cannot be earlier than trip start (${tripStartStr})`;
      } else if (activityForm.date > tripEndStr) {
        errors.date = `Date cannot be later than trip end (${tripEndStr})`;
      }
    }
    setActivityFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    setActivityError('');

    if (!validateActivityForm()) {
      return;
    }

    setActivitySubmitting(true);
    try {
      if (editingActivity) {
        const res = await updateActivity(tripId, editingActivity._id, {
          title: activityForm.title.trim(),
          date: activityForm.date,
          startTime: activityForm.startTime.trim(),
          location: activityForm.location.trim(),
          notes: activityForm.notes.trim(),
        });
        setTrip(res.trip);
        setOperationSuccess('Activity updated successfully.');
      } else {
        const res = await addActivity(tripId, {
          title: activityForm.title.trim(),
          date: activityForm.date,
          startTime: activityForm.startTime.trim(),
          location: activityForm.location.trim(),
          notes: activityForm.notes.trim(),
        });
        setTrip(res.trip);
        setOperationSuccess('Activity added to itinerary.');
      }
      setShowActivityModal(false);
      setTimeout(() => setOperationSuccess(''), 3000);
    } catch (err) {
      setActivityError(err.message || 'Failed to save activity');
    } finally {
      setActivitySubmitting(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;
    setActivitySubmitting(true);
    try {
      const res = await deleteActivity(tripId, activityToDelete._id);
      setTrip(res.trip);
      setActivityToDelete(null);
      setOperationSuccess('Activity deleted successfully.');
      setTimeout(() => setOperationSuccess(''), 3000);
    } catch (err) {
      setOperationError(err.message || 'Failed to delete activity');
    } finally {
      setActivitySubmitting(false);
    }
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

  const handleToggleRole = async (participant) => {
    const newRole = participant.role === 'organizer' ? 'member' : 'organizer';
    setOperationError('');
    try {
      const res = await updateParticipant(tripId, participant._id, { role: newRole });
      setTrip(res.trip);
      setOperationSuccess(`Changed ${participant.name}'s role to ${newRole}.`);
      setTimeout(() => setOperationSuccess(''), 3000);
    } catch (err) {
      setOperationError(err.message || 'Failed to update participant role');
      setTimeout(() => setOperationError(''), 4000);
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

  const participants = trip?.participants || [];
  const organizerCount = participants.filter((p) => p.role === 'organizer').length;
  const memberCount = participants.filter((p) => p.role === 'member').length;

  const filteredParticipants = participants.filter((p) => {
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    const matchesSearch =
      !participantSearch.trim() ||
      p.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(participantSearch.toLowerCase()));
    return matchesRole && matchesSearch;
  });

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
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Operation Feedback Toast */}
      {operationSuccess && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-medium">{operationSuccess}</span>
        </div>
      )}

      {/* Operation Error Toast */}
      {operationError && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 flex items-center gap-2 shadow-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-sm font-medium">{operationError}</span>
        </div>
      )}

      {/* Trip Hero Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm mb-8 transition-colors duration-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                <MapPin className="w-3.5 h-3.5" />
                <span>{trip.destination}</span>
              </span>
              {trip.isDemo && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Demo
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>
                  {formatDate(trip.startDate)} &mdash; {formatDate(trip.endDate)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                <Users className="w-3.5 h-3.5" />
                <span>{participants.length} {participants.length === 1 ? 'participant' : 'participants'}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {trip.name}
              </h1>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300"
                title="Edit trip details"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Edit Trip</span>
              </button>
            </div>

            {trip.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">{trip.description}</p>
            )}
          </div>

          {/* Quick Invite Code Box */}
          <div className="w-full md:w-auto bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Trip Invite Code
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-slate-900 dark:text-white px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                {trip.inviteCode || 'N/A'}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                title="Copy Invite Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition text-xs font-semibold"
                title="Copy shareable link to join"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied Link!' : 'Share Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Day-Wise Itinerary Section (Module 1 - Part 3 / Stage 4) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm mb-8 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trip Itinerary</h2>
              <span className="text-xs bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-2.5 py-0.5 rounded-full font-semibold">
                {sortedActivities.length} {sortedActivities.length === 1 ? 'activity' : 'activities'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Plan and view daily activities across your trip duration ({tripDays.length} {tripDays.length === 1 ? 'day' : 'days'}).
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddActivityModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Activity</span>
          </button>
        </div>

        {/* Day Navigation Tabs */}
        <div className="py-4 border-b border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <button
              type="button"
              onClick={() => setSelectedDay('all')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                selectedDay === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>All Days</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedDay === 'all'
                    ? 'bg-brand-700/60 text-white'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200'
                }`}
              >
                {sortedActivities.length}
              </span>
            </button>

            {tripDays.map((day) => {
              const countForDay = sortedActivities.filter(
                (a) => toDateInputValue(a.date) === day.dateKey
              ).length;
              const isSelected = selectedDay === day.dateKey;

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => setSelectedDay(day.dateKey)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <span>{day.label}</span>
                  <span className={isSelected ? 'text-brand-100 text-[11px]' : 'text-slate-400 dark:text-slate-400 text-[11px]'}>
                    &bull; {day.displayDate}
                  </span>
                  {countForDay > 0 && (
                    <span
                      className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected
                          ? 'bg-brand-700/60 text-white'
                          : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {countForDay}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Activities List Area */}
        <div className="pt-6">
          {displayedActivities.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {selectedDay === 'all'
                  ? 'No activities planned yet'
                  : `No activities planned for ${
                      tripDays.find((d) => d.dateKey === selectedDay)?.label || 'this day'
                    }`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                {selectedDay === 'all'
                  ? 'Start organizing your trip itinerary by adding daily activities, places to visit, and schedules.'
                  : 'Add sightseeing spots, tours, reservations, or travel plans for this day.'}
              </p>
              <button
                type="button"
                onClick={() =>
                  handleOpenAddActivityModal(selectedDay !== 'all' ? selectedDay : null)
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Activity</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {displayedActivities.map((activity) => {
                const actDateStr = toDateInputValue(activity.date);
                const matchingDay = tripDays.find((d) => d.dateKey === actDateStr);

                return (
                  <div
                    key={activity._id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-sm transition bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Time / Clock Badge */}
                      <div className="flex-shrink-0 w-16 sm:w-20 pt-0.5 text-center">
                        {activity.startTime ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-semibold">
                            <Clock className="w-3 h-3 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                            <span>{activity.startTime}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md inline-block">
                            Anytime
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                            {activity.title}
                          </h4>
                          {selectedDay === 'all' && matchingDay && (
                            <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                              {matchingDay.label} &bull; {matchingDay.displayDate}
                            </span>
                          )}
                        </div>

                        {activity.location && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                            <span className="truncate">{activity.location}</span>
                          </p>
                        )}

                        {activity.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-line leading-relaxed">
                            {activity.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center border-t border-slate-100 dark:border-slate-700 sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenEditActivityModal(activity)}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        title="Edit activity"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOperationError('');
                          setActivityToDelete(activity);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Delete activity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Invitations & Add Participant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column: Shareable Invitations & Invite Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Shareable Invite Card */}
          <div className="bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-brand-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Trip Invitations</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Share the unique code or direct link with friends so they can join this trip immediately.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-brand-200 dark:border-slate-700 shadow-sm">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Code:</span>
                <span className="font-mono text-sm font-bold text-brand-700 dark:text-brand-400">
                  {trip.inviteCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
                  title="Copy code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Send Invitation</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Record an invite for a participant. They will appear as "Invited" until they join.
            </p>

            <form onSubmit={handleInviteByEmail} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Friend's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aman Verma"
                  value={inviteEmailForm.name}
                  onChange={(e) => setInviteEmailForm({ ...inviteEmailForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-100 focus:border-brand-600 dark:focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Friend's Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. aman@example.com"
                  value={inviteEmailForm.email}
                  onChange={(e) => setInviteEmailForm({ ...inviteEmailForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-100 focus:border-brand-600 dark:focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isInviting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-60"
              >
                {isInviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Record Invitation</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Participants List & Persistence Management */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
            {/* Header with Title and Add Button */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Trip Participants</h3>
                  <span className="text-xs bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-2.5 py-0.5 rounded-full font-semibold">
                    {participants.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {organizerCount} {organizerCount === 1 ? 'organizer' : 'organizers'} &bull; {memberCount} {memberCount === 1 ? 'member' : 'members'} persisted in MongoDB
                </p>
              </div>
              <button
                onClick={() => {
                  setOperationError('');
                  setShowAddParticipantModal(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Participant</span>
              </button>
            </div>

            {/* Controls: Search and Role Filter */}
            {participants.length > 0 && (
              <div className="px-6 py-3 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search participants by name or email..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setRoleFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      roleFilter === 'all'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    All ({participants.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('organizer')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      roleFilter === 'organizer'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Organizers ({organizerCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('member')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      roleFilter === 'member'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Members ({memberCount})
                  </button>
                </div>
              </div>
            )}

            {participants.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No participants yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
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
            ) : filteredParticipants.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No participants match your search criteria</p>
                <button
                  onClick={() => {
                    setParticipantSearch('');
                    setRoleFilter('all');
                  }}
                  className="mt-2 text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredParticipants.map((participant) => {
                  const initials = participant.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={participant._id}
                      className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-sm flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                              {participant.name}
                            </span>

                            {/* Interactive Role Switcher Pill */}
                            <button
                              type="button"
                              onClick={() => handleToggleRole(participant)}
                              title={`Click to switch to ${participant.role === 'organizer' ? 'member' : 'organizer'}`}
                              className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition hover:opacity-80 flex items-center gap-1 ${
                                participant.role === 'organizer'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              {participant.role === 'organizer' ? (
                                <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <UserCheck className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              )}
                              <span>{participant.role}</span>
                            </button>

                            {participant.status === 'invited' && (
                              <span className="text-[10px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                                Invited
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {participant.email || 'No email provided'} &bull; Joined{' '}
                            {formatDate(participant.joinedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setOperationError('');
                            setParticipantToDelete(participant);
                          }}
                          className="text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="Remove participant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-xl relative transition-colors duration-200">
            <button
              onClick={() => setShowAddParticipantModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Trip Participant</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
              Add a traveler directly into this trip's member directory with persistence in MongoDB.
            </p>

            {operationError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs flex items-center gap-2 border border-red-200 dark:border-red-900/60">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{operationError}</span>
              </div>
            )}

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nishka Shah"
                  value={participantForm.name}
                  onChange={(e) =>
                    setParticipantForm({ ...participantForm, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-600 dark:focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. nishka@example.com"
                  value={participantForm.email}
                  onChange={(e) =>
                    setParticipantForm({ ...participantForm, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-600 dark:focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  value={participantForm.role}
                  onChange={(e) =>
                    setParticipantForm({ ...participantForm, role: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-600 dark:focus:border-brand-500 focus:outline-none"
                >
                  <option value="member">Trip Member</option>
                  <option value="organizer">Trip Organizer</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddParticipantModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6 shadow-xl relative transition-colors duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Remove Participant</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">"{participantToDelete.name}"</strong> from this trip?
            </p>

            {participantToDelete.role === 'organizer' && organizerCount === 1 && participants.length > 1 && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 border border-amber-200 dark:border-amber-900/60">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>This participant is the only organizer. You must assign another organizer before removing them.</span>
              </div>
            )}

            {operationError && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs flex items-center gap-2 border border-red-200 dark:border-red-900/60">
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
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRemoveParticipant}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-sm disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Trip Details (Module 1 - Nishka Shah) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 sm:p-8 shadow-xl relative max-h-[90vh] overflow-y-auto transition-colors duration-200">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
              <Edit3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Trip Details</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-5">
              Update travel destination, dates, or trip notes. Participants and invite codes remain unaffected.
            </p>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs flex items-center gap-2 border border-red-200 dark:border-red-900/60">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTrip} noValidate className="space-y-4">
              {/* Trip Name */}
              <div>
                <label htmlFor="edit-trip-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Trip Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="edit-trip-name"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    disabled={editSubmitting}
                    placeholder="e.g. Goa Getaway with Friends"
                    className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-900 focus:outline-none transition ${
                      editFieldErrors.name
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40 bg-red-50/20 dark:bg-red-950/20'
                        : 'border-slate-300 dark:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50'
                    }`}
                  />
                </div>
                {editFieldErrors.name && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{editFieldErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Destination */}
              <div>
                <label htmlFor="edit-destination" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Destination <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="edit-destination"
                    name="destination"
                    value={editForm.destination}
                    onChange={handleEditChange}
                    disabled={editSubmitting}
                    placeholder="e.g. Goa, India"
                    className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-900 focus:outline-none transition ${
                      editFieldErrors.destination
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40 bg-red-50/20 dark:bg-red-950/20'
                        : 'border-slate-300 dark:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50'
                    }`}
                  />
                </div>
                {editFieldErrors.destination && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{editFieldErrors.destination}</span>
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-startDate" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      id="edit-startDate"
                      name="startDate"
                      value={editForm.startDate}
                      onChange={handleEditChange}
                      disabled={editSubmitting}
                      className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none transition ${
                        editFieldErrors.startDate
                          ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40 bg-red-50/20 dark:bg-red-950/20'
                          : 'border-slate-300 dark:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50'
                      }`}
                    />
                  </div>
                  {editFieldErrors.startDate && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{editFieldErrors.startDate}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-endDate" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      id="edit-endDate"
                      name="endDate"
                      value={editForm.endDate}
                      min={editForm.startDate || undefined}
                      onChange={handleEditChange}
                      disabled={editSubmitting}
                      className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none transition ${
                        editFieldErrors.endDate
                          ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40 bg-red-50/20 dark:bg-red-950/20'
                          : 'border-slate-300 dark:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50'
                      }`}
                    />
                  </div>
                  {editFieldErrors.endDate && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{editFieldErrors.endDate}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="edit-description" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description <span className="text-xs text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute top-2.5 left-3.5 pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <textarea
                    id="edit-description"
                    name="description"
                    rows={3}
                    value={editForm.description}
                    onChange={handleEditChange}
                    disabled={editSubmitting}
                    placeholder="Add notes, travel goals, or details about this trip..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={editSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition shadow-sm disabled:opacity-60"
                >
                  {editSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Activity (Module 1 - Part 3 / Stage 4) */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 sm:p-8 shadow-xl relative max-h-[90vh] overflow-y-auto transition-colors duration-200">
            <button
              type="button"
              onClick={() => setShowActivityModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingActivity ? 'Edit Activity' : 'Add Activity to Itinerary'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-5">
              {editingActivity
                ? 'Update activity schedule, location, or notes.'
                : 'Schedule a new activity, visit, or travel plan within your trip dates.'}
            </p>

            {activityError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs flex items-center gap-2 border border-red-200 dark:border-red-900/60">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{activityError}</span>
              </div>
            )}

            <form onSubmit={handleSaveActivity} noValidate className="space-y-4">
              {/* Activity Title */}
              <div>
                <label htmlFor="activity-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Activity Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="activity-title"
                    name="title"
                    value={activityForm.title}
                    onChange={handleActivityFormChange}
                    disabled={activitySubmitting}
                    placeholder="e.g. Scuba Diving at Calangute Beach"
                    className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-900 focus:outline-none transition ${
                      activityFieldErrors.title
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40 bg-red-50/20 dark:bg-red-950/20'
                        : 'border-slate-300 dark:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50'
                    }`}
                  />
                </div>
                {activityFieldErrors.title && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{activityFieldErrors.title}</span>
                  </p>
                )}
              </div>

              {/* Date & Start Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="activity-date" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      id="activity-date"
                      name="date"
                      value={activityForm.date}
                      min={toDateInputValue(trip.startDate)}
                      max={toDateInputValue(trip.endDate)}
                      onChange={handleActivityFormChange}
                      disabled={activitySubmitting}
                      className={`w-full pl-10 pr-3.5 py-2 rounded-xl border text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none transition ${
                        activityFieldErrors.date
                          ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40 bg-red-50/20 dark:bg-red-950/20'
                          : 'border-slate-300 dark:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50'
                      }`}
                    />
                  </div>
                  {activityFieldErrors.date && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{activityFieldErrors.date}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="activity-time" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Time <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      type="time"
                      id="activity-time"
                      name="startTime"
                      value={activityForm.startTime}
                      onChange={handleActivityFormChange}
                      disabled={activitySubmitting}
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="activity-location" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Location <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="activity-location"
                    name="location"
                    value={activityForm.location}
                    onChange={handleActivityFormChange}
                    disabled={activitySubmitting}
                    placeholder="e.g. Calangute, North Goa"
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="activity-notes" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Instructions <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute top-2.5 left-3.5 pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <textarea
                    id="activity-notes"
                    name="notes"
                    rows={3}
                    value={activityForm.notes}
                    onChange={handleActivityFormChange}
                    disabled={activitySubmitting}
                    placeholder="Add reminders, booking IDs, things to bring, or meeting points..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  disabled={activitySubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={activitySubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition shadow-sm disabled:opacity-60"
                >
                  {activitySubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingActivity ? 'Save Changes' : 'Add Activity'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Activity Confirmation */}
      {activityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6 shadow-xl relative transition-colors duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Activity</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">"{activityToDelete.title}"</strong> from your itinerary?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActivityToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={activitySubmitting}
                onClick={handleDeleteActivity}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-sm disabled:opacity-60"
              >
                {activitySubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
