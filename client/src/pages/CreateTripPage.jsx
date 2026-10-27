import React from 'react';
import { PlusCircle } from 'lucide-react';

export default function CreateTripPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Create a New Trip</h1>
        <p className="text-sm text-slate-600 mt-1">
          Set up your travel dates and destination.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        <PlusCircle className="w-10 h-10 mx-auto text-brand-500 mb-3" />
        <p className="text-base font-medium text-slate-700">Trip creation form will be implemented in Stage 3.</p>
        <p className="text-xs text-slate-400 mt-1">Foundational route verified.</p>
      </div>
    </div>
  );
}
