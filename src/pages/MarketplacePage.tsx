import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Brain as Train, X } from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import { SEAT_TYPES, BANGLADESH_STATIONS } from '../utils/format';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import TicketCard from '../components/ui/TicketCard';
import { SkeletonCard } from '../components/ui/LoadingSpinner';

export default function MarketplacePage() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    source: '',
    destination: '',
    date: '',
    seat_type: '',
    min_price: '',
    max_price: '',
    search: '',
  });

  const appliedFilters = {
    source: filters.source || undefined,
    destination: filters.destination || undefined,
    date: filters.date || undefined,
    seat_type: filters.seat_type || undefined,
    min_price: filters.min_price ? Number(filters.min_price) : undefined,
    max_price: filters.max_price ? Number(filters.max_price) : undefined,
  };

  const { tickets, loading, error } = useTickets(appliedFilters);

  const updateFilter = (k: string, v: string) => setFilters(prev => ({ ...prev, [k]: v }));
  const clearFilters = () => setFilters({ source: '', destination: '', date: '', seat_type: '', min_price: '', max_price: '', search: '' });
  const hasFilters = Object.values(filters).some(v => v !== '');

  const displayed = filters.search
    ? tickets.filter(t =>
        t.train_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.source.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.destination.toLowerCase().includes(filters.search.toLowerCase())
      )
    : tickets;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {/* Header */}
      <div className="pt-16 pb-8 border-b border-white/5 bg-gradient-to-b from-gray-900/50 to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 text-cyan-400 text-sm mb-2">
              <Train size={14} /> Marketplace
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Find Your Train Ticket</h1>
            <p className="text-gray-400">Browse verified tickets with AI fraud detection scores</p>
          </motion.div>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
                placeholder="Search trains, routes..."
                className="w-full pl-11 pr-4 py-3 bg-gray-900/60 border border-white/10 focus:border-cyan-500/50 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                showFilters || hasFilters
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                  : 'bg-gray-900/60 border-white/10 text-gray-400 hover:text-gray-200'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:block">Filters</span>
              {hasFilters && <span className="w-2 h-2 bg-cyan-400 rounded-full" />}
            </button>
          </motion.div>

          {/* Filters panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-gray-900/60 border border-white/5 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                  <Filter size={14} /> Filter Tickets
                </div>
                {hasFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-red-400 text-xs hover:text-red-300 transition-colors">
                    <X size={12} /> Clear All
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <select value={filters.source} onChange={e => updateFilter('source', e.target.value)}
                  className="col-span-1 px-3 py-2.5 bg-gray-800/60 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-cyan-500/50">
                  <option value="">From Station</option>
                  {BANGLADESH_STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filters.destination} onChange={e => updateFilter('destination', e.target.value)}
                  className="col-span-1 px-3 py-2.5 bg-gray-800/60 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-cyan-500/50">
                  <option value="">To Station</option>
                  {BANGLADESH_STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="date" value={filters.date} onChange={e => updateFilter('date', e.target.value)}
                  className="col-span-1 px-3 py-2.5 bg-gray-800/60 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-cyan-500/50" />
                <select value={filters.seat_type} onChange={e => updateFilter('seat_type', e.target.value)}
                  className="col-span-1 px-3 py-2.5 bg-gray-800/60 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-cyan-500/50">
                  <option value="">Seat Class</option>
                  {SEAT_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <input type="number" value={filters.min_price} onChange={e => updateFilter('min_price', e.target.value)}
                  placeholder="Min ৳" className="col-span-1 px-3 py-2.5 bg-gray-800/60 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500/50" />
                <input type="number" value={filters.max_price} onChange={e => updateFilter('max_price', e.target.value)}
                  placeholder="Max ৳" className="col-span-1 px-3 py-2.5 bg-gray-800/60 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500/50" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400 text-sm">
            {loading ? 'Loading...' : `${displayed.length} ticket${displayed.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Train size={48} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-gray-400 text-xl font-semibold mb-2">Error Loading Tickets</h3>
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-gray-500 text-xs mt-2">Please check your connection and try again.</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <Train size={48} className="text-gray-700 mx-auto mb-4" />
            <h3 className="text-gray-400 text-xl font-semibold mb-2">No tickets found</h3>
            <p className="text-gray-600 text-sm">Try adjusting your filters or check back later.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map((ticket, i) => (
              <TicketCard key={ticket.id} ticket={ticket} index={i} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
