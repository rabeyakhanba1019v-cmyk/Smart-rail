import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain as Train, ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-lg"
      >
        <motion.div
          animate={{ y: [-8, 8, -8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8"
        >
          <Train size={40} className="text-cyan-400" />
        </motion.div>

        <h1 className="text-8xl font-bold mb-4">
          <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">404</span>
        </h1>
        <h2 className="text-2xl font-bold text-white mb-3">Train Left the Station</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Looks like this page has departed. The route you're looking for doesn't exist or has been moved to another track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-gray-950 font-bold rounded-xl hover:from-cyan-400 hover:to-emerald-400 transition-all">
            <Home size={16} /> Go Home
          </Link>
          <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/30 rounded-xl transition-all">
            <Search size={16} /> Browse Marketplace
          </Link>
          <button onClick={() => history.back()} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/30 rounded-xl transition-all">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
