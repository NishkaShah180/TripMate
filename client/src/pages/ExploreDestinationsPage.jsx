import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Search,
  X,
  Mountain,
  Sun,
  Building2,
  Trees,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { CATEGORIES, DESTINATIONS } from '../data/destinations';

export default function ExploreDestinationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [imgErrors, setImgErrors] = useState({});

  // Map category to an appropriate icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Mountains':
        return <Mountain className="w-3.5 h-3.5" />;
      case 'Beaches':
        return <Sun className="w-3.5 h-3.5" />;
      case 'Cities':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'Nature':
        return <Trees className="w-3.5 h-3.5" />;
      default:
        return <Compass className="w-3.5 h-3.5" />;
    }
  };

  // Filter destinations based on category and search query
  const filteredDestinations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return DESTINATIONS.filter((dest) => {
      const matchesCategory =
        selectedCategory === 'All' || dest.category === selectedCategory;

      const matchesSearch =
        !query ||
        dest.name.toLowerCase().includes(query) ||
        dest.region.toLowerCase().includes(query) ||
        dest.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleImageError = (id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Curated Travel Guide</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Explore Destinations
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Discover incredible mountains, beaches, historic cities, and natural escapes to inspire your next adventure.
        </p>
      </div>

      {/* Search and Category Filters Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by destination name, region, or keyword (e.g. Manali, Ladakh, Beaches)..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
            Category:
          </span>
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            const count =
              category === 'All'
                ? DESTINATIONS.length
                : DESTINATIONS.filter((d) => d.category === category).length;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {getCategoryIcon(category)}
                <span>{category}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected
                      ? 'bg-brand-700/60 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Reset Filters Link if filters active */}
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={handleResetFilters}
              className="ml-auto text-xs text-brand-600 hover:text-brand-700 font-semibold hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs font-medium text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredDestinations.length}</span>{' '}
          {filteredDestinations.length === 1 ? 'destination' : 'destinations'}
          {selectedCategory !== 'All' && (
            <span> in <strong className="text-slate-700">{selectedCategory}</strong></span>
          )}
          {searchQuery && (
            <span> matching "<strong className="text-slate-700">{searchQuery}</strong>"</span>
          )}
        </p>
      </div>

      {/* Destinations Grid / Empty State */}
      {filteredDestinations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Compass className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">No destinations found</h2>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            We couldn't find any destinations matching your current search or category filter. Try clearing your filters or searching for something else.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-sm"
          >
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDestinations.map((dest) => {
            const hasImgError = imgErrors[dest.id];

            return (
              <div
                key={dest.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image container with fallback */}
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                    {!hasImgError ? (
                      <img
                        src={dest.image}
                        alt={dest.name}
                        loading="lazy"
                        onError={() => handleImageError(dest.id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      /* Graceful Fallback Container */
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                        <Compass className="w-8 h-8 mb-1 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">{dest.name}</span>
                      </div>
                    )}

                    {/* Category Floating Pill */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 backdrop-blur-sm text-slate-800 shadow-sm border border-white/40">
                        {getCategoryIcon(dest.category)}
                        <span>{dest.category}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-xs text-brand-700 font-medium mb-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{dest.region}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition mb-2">
                      {dest.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                      {dest.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {dest.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Plan Trip action */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Ready to visit?
                  </span>
                  <Link
                    to="/trips/new"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
                  >
                    <span>Plan a Trip</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
