import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain as Train, MapPin, Clock, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { Ticket } from '../../types';
import { formatPrice, formatDate } from '../../utils/format';

interface TicketCardProps {
  ticket: Ticket;
  index?: number;
}

export default function TicketCard({ ticket, index = 0 }: TicketCardProps) {
  const isSold = ticket.status === 'sold';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link to={`/ticket/${ticket.id}`}>
        <div className={`bg-gray-900/60 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${isSold ? 'border-gray-500/20 hover:shadow-gray-500/5' : 'border-white/5 hover:border-cyan-500/30 hover:shadow-cyan-500/10'} ${isSold ? 'opacity-80' : ''}`}>
          {/* Top strip */}
          <div className={`h-1 ${isSold ? 'bg-gray-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-500'}`} />

          {/* Ticket image */}
          {ticket.image_url ? (
            <div className="relative h-32 overflow-hidden bg-gray-800">
              <img
                src={ticket.image_url}
                alt={ticket.train_name}
                className={`w-full h-full object-cover transition-transform duration-300 ${isSold ? 'grayscale' : 'group-hover:scale-105'}`}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
              {/* SOLD overlay */}
              {isSold && (
                <div className="absolute inset-0 bg-gray-950/50 flex items-center justify-center">
                  <div className="bg-gray-800 border-2 border-gray-400 px-6 py-2 rounded-lg transform -rotate-12">
                    <span className="text-gray-300 font-black text-xl tracking-widest">SOLD</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                <div className="flex items-center gap-1.5">
                  <Train size={14} className={isSold ? 'text-gray-400' : 'text-cyan-400'} />
                  <p className="text-white font-semibold text-sm drop-shadow-lg">{ticket.train_name}</p>
                </div>
                <p className={`font-bold text-lg drop-shadow-lg ${isSold ? 'text-gray-400' : 'text-cyan-400'}`}>{formatPrice(ticket.price)}</p>
              </div>
            </div>
          ) : null}

          <div className="p-5">
            {/* Header - only show if no image */}
            {!ticket.image_url && (
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSold ? 'bg-gray-700/50' : 'bg-cyan-500/10'}`}>
                    <Train size={16} className={isSold ? 'text-gray-500' : 'text-cyan-400'} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight">{ticket.train_name}</p>
                    {isSold && (
                      <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <CheckCircle size={10} /> Sold
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${isSold ? 'text-gray-500' : 'text-cyan-400'}`}>{formatPrice(ticket.price)}</p>
                  {ticket.original_price > 0 && ticket.original_price !== ticket.price && (
                    <p className="text-gray-500 text-xs line-through">{formatPrice(ticket.original_price)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Sold badge when image exists */}
            {ticket.image_url && isSold && (
              <div className="flex items-center justify-between mb-3 -mt-1">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <CheckCircle size={10} /> Sold
                </p>
                {ticket.original_price > 0 && ticket.original_price !== ticket.price && (
                  <p className="text-gray-500 text-xs line-through">{formatPrice(ticket.original_price)}</p>
                )}
              </div>
            )}

            {/* Route */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 text-center">
                <p className={`font-semibold text-sm ${isSold ? 'text-gray-500' : 'text-white'}`}>{ticket.source}</p>
              </div>
              <div className="flex-1 flex items-center justify-center gap-1">
                <div className={`flex-1 h-px ${isSold ? 'bg-gray-700' : 'bg-gradient-to-r from-cyan-500/30 to-emerald-500/30'}`} />
                <ArrowRight size={12} className={isSold ? 'text-gray-600' : 'text-cyan-400'} />
                <div className={`flex-1 h-px ${isSold ? 'bg-gray-700' : 'bg-gradient-to-r from-cyan-500/30 to-emerald-500/30'}`} />
              </div>
              <div className="flex-1 text-center">
                <p className={`font-semibold text-sm ${isSold ? 'text-gray-500' : 'text-white'}`}>{ticket.destination}</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className={isSold ? 'text-gray-600' : 'text-cyan-500/60'} />
                {ticket.departure_time}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className={isSold ? 'text-gray-600' : 'text-emerald-500/60'} />
                {formatDate(ticket.journey_date)}
              </div>
              <div className="flex items-center gap-1.5 bg-gray-800/50 rounded-md px-2 py-1">
                <span className="text-gray-500">Seat:</span> {ticket.seat_type}
              </div>
              {ticket.coach && (
                <div className="flex items-center gap-1.5 bg-gray-800/50 rounded-md px-2 py-1">
                  <span className="text-gray-500">Coach:</span> {ticket.coach}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                {ticket.profiles && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-gray-950">
                      {ticket.profiles.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex items-center gap-0.5 text-yellow-400 text-xs">
                      <Star size={10} fill="currentColor" /> {ticket.profiles.rating.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>
              {isSold && (
                <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle size={10} /> Sold
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
