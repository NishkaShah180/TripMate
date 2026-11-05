import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { createTrip } from '../services/tripService';
import {
  Compass,
  MapPin,
  Calendar,
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
} from 'lucide-react';

export default function CreateTripPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledDestination = searchParams.get('destination') || '';

  // Form state - prefill destination (and suggested trip name) if present in URL query params
  const [formData, setFormData] = useState(() => {
    const dest = prefilledDestination.trim();
    return {
      name: dest ? `${dest} Adventure` : '',
      destination: dest,
      startDate: '',
      endDate: '',
      description: '',
      organizerName: '',
      organizerEmail: '',
    };
  });

  // Sync if query parameter changes dynamically
  useEffect(() => {
    const destParam = searchParams.get('destination');
    if (destParam && destParam.trim()) {
      const dest = destParam.trim();
      setFormData((prev) => ({
        ...prev,
        destination: prev.destination ? prev.destination : dest,
        name: prev.name ? prev.name : `${dest} Adventure`,
      }));
    }
  }, [searchParams]);

  // UI state
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  // Handle controlled input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    if (apiError) setApiError('');
  };

  // Client-side validation
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Trip name is required';
    }

    if (!formData.destination.trim()) {
      errors.destination = 'Destination is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End date cannot be earlier than start date';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createTrip({
        name: formData.name.trim(),
        destination: formData.destination.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description.trim(),
        organizerName: formData.organizerName.trim(),
        organizerEmail: formData.organizerEmail.trim(),
      });

      setSuccessInfo(response.trip || { name: formData.name });

      // Automatically navigate to trip details after brief feedback
      setTimeout(() => {
        if (response.trip?._id) {
          navigate(`/trips/${response.trip._id}`);
        } else {
          navigate('/');
        }
      }, 1200);
    } catch (err) {
      setApiError(err.message || 'Failed to create trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Create a New Trip</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Enter your travel details below to begin organizing your trip and inviting participants.
        </p>
      </div>

      {/* Success banner */}
      {successInfo && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Trip "{successInfo.name}" created successfully!</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Opening trip workspace to invite friends...
              </p>
            </div>
          </div>
          <Link
            to={successInfo._id ? `/trips/${successInfo._id}` : '/'}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            Open Trip
          </Link>
        </div>
      )}

      {/* API Error banner */}
      {apiError && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Unable to create trip</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8 transition-colors duration-200">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Section: Trip Basics */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-4">
              Trip Details
            </h2>

            {/* Trip Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                Trip Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Compass className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting || !!successInfo}
                  placeholder="e.g., Goa Getaway with Friends"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-900 focus:outline-none transition ${
                    fieldErrors.name
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40 bg-red-50/20 dark:bg-red-950/20'
                      : 'border-slate-300 dark:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50'
                  }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.name}</span>
                </p>
              )}
            </div>

            {/* Destination */}
            <div className="mb-4">
              <label htmlFor="destination" className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                Destination <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  disabled={isSubmitting || !!successInfo}
                  placeholder="e.g., Goa, India"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-900 focus:outline-none transition ${
                    fieldErrors.destination
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40 bg-red-50/20 dark:bg-red-950/20'
                      : 'border-slate-300 dark:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50'
                  }`}
                />
              </div>
              {fieldErrors.destination && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.destination}</span>
                </p>
              )}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    disabled={isSubmitting || !!successInfo}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-900 focus:outline-none transition ${
                      fieldErrors.startDate
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40 bg-red-50/20 dark:bg-red-950/20'
                        : 'border-slate-300 dark:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50'
                    }`}
                  />
                </div>
                {fieldErrors.startDate && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{fieldErrors.startDate}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    min={formData.startDate || undefined}
                    onChange={handleChange}
                    disabled={isSubmitting || !!successInfo}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-900 focus:outline-none transition ${
                      fieldErrors.endDate
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/40 bg-red-50/20 dark:bg-red-950/20'
                        : 'border-slate-300 dark:border-slate-600 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50'
                    }`}
                  />
                </div>
                {fieldErrors.endDate && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{fieldErrors.endDate}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Organizer Details (Module 2 - Heer Shah) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-4">
              Organizer Details (Module 2)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
              <div>
                <label htmlFor="organizerName" className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                  Your Name (Organizer) <span className="text-xs text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="organizerName"
                    name="organizerName"
                    value={formData.organizerName}
                    onChange={handleChange}
                    disabled={isSubmitting || !!successInfo}
                    placeholder="e.g., Heer Shah"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="organizerEmail" className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                  Organizer Email <span className="text-xs text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="organizerEmail"
                    name="organizerEmail"
                    value={formData.organizerEmail}
                    onChange={handleChange}
                    disabled={isSubmitting || !!successInfo}
                    placeholder="e.g., heer@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <label htmlFor="description" className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
              Description <span className="text-xs text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                disabled={isSubmitting || !!successInfo}
                placeholder="Add notes, travel goals, or details about this trip..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-950/50 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !!successInfo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Trip...</span>
                </>
              ) : (
                <span>Create Trip</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
