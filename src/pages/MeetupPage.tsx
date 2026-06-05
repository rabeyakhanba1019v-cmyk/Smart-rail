import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Zap, Brain as Train, ArrowRight, CheckCircle, Navigation, Map } from 'lucide-react';
import { suggestMeetup, DHAKA_STATIONS } from '../utils/meetup';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function MeetupPage() {
  const [buyerStation, setBuyerStation] = useState('');
  const [buyerTime, setBuyerTime] = useState('');
  const [sellerStation, setSellerStation] = useState('');
  const [sellerTime, setSellerTime] = useState('');
  const [result, setResult] = useState<{ station: string; time: string; reasoning: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleSuggest = () => {
    if (!buyerStation || !buyerTime || !sellerStation || !sellerTime) return;
    setLoading(true);
    setTimeout(() => {
      const suggestion = suggestMeetup(buyerStation, buyerTime, sellerStation, sellerTime);
      setResult(suggestion);
      setLoading(false);
    }, 1500);
  };

  const stationNames = DHAKA_STATIONS.map(s => s.name);

  const getStationCoords = (name: string) => DHAKA_STATIONS.find(s => s.name === name);
  const meetupStation = result ? getStationCoords(result.station) : null;
  const buyerCoords = getStationCoords(buyerStation);
  const sellerCoords = getStationCoords(sellerStation);

  const mapCenter = meetupStation
    ? { lat: meetupStation.lat, lng: meetupStation.lng }
    : buyerCoords && sellerCoords
    ? { lat: (buyerCoords.lat + sellerCoords.lat) / 2, lng: (buyerCoords.lng + sellerCoords.lng) / 2 }
    : { lat: 23.8103, lng: 90.4125 };

  const mapZoom = meetupStation ? 13 : 7;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center">
              <Navigation size={20} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Smart Meetup Engine</h1>
              <p className="text-gray-500 text-sm">AI-powered optimal meeting point recommendation</p>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm mb-1">How it works</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Enter your location and available time, along with the other party's details.
                Our AI analyzes both positions on the Bangladesh Railway route network to suggest
                the most convenient intermediate station and time for both of you.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Input form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Buyer */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-gray-900/60 border border-cyan-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400">B</div>
              <p className="text-white font-semibold text-sm">Buyer Location</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 flex items-center gap-1">
                  <MapPin size={10} /> Station
                </label>
                <select value={buyerStation} onChange={e => setBuyerStation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white outline-none transition-all">
                  <option value="">Select Station</option>
                  {stationNames.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 flex items-center gap-1">
                  <Clock size={10} /> Available From
                </label>
                <input type="time" value={buyerTime} onChange={e => setBuyerTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white outline-none transition-all" />
              </div>
            </div>
          </motion.div>

          {/* Seller */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="bg-gray-900/60 border border-emerald-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">S</div>
              <p className="text-white font-semibold text-sm">Seller Location</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 flex items-center gap-1">
                  <MapPin size={10} /> Station
                </label>
                <select value={sellerStation} onChange={e => setSellerStation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-emerald-500/10 focus:border-emerald-500/50 rounded-lg text-sm text-white outline-none transition-all">
                  <option value="">Select Station</option>
                  {stationNames.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 flex items-center gap-1">
                  <Clock size={10} /> Available From
                </label>
                <input type="time" value={sellerTime} onChange={e => setSellerTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-emerald-500/10 focus:border-emerald-500/50 rounded-lg text-sm text-white outline-none transition-all" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Suggest button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={handleSuggest}
          disabled={!buyerStation || !buyerTime || !sellerStation || !sellerTime || loading}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 text-lg"
        >
          {loading ? (
            <><div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" /> Analyzing Routes...</>
          ) : (
            <><Zap size={20} /> Get Smart Meetup Suggestion</>
          )}
        </motion.button>

        {/* Result */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gradient-to-br from-cyan-500/15 to-emerald-500/10 border border-cyan-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                  <CheckCircle size={16} className="text-gray-950" />
                </div>
                <p className="text-white font-bold text-lg">AI Meetup Recommendation</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="text-center p-3 bg-gray-900/50 rounded-xl">
                  <p className="text-gray-500 text-xs mb-1">Buyer</p>
                  <p className="text-cyan-400 font-semibold text-sm">{buyerStation}</p>
                  <p className="text-gray-400 text-xs">{buyerTime}</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-b from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl">
                  <p className="text-gray-400 text-xs mb-1">Meet Here</p>
                  <div className="flex justify-center mb-1"><Train size={14} className="text-emerald-400" /></div>
                  <p className="text-white font-bold text-sm">{result.station}</p>
                  <p className="text-emerald-400 font-semibold text-sm">{result.time}</p>
                </div>
                <div className="text-center p-3 bg-gray-900/50 rounded-xl">
                  <p className="text-gray-500 text-xs mb-1">Seller</p>
                  <p className="text-emerald-400 font-semibold text-sm">{sellerStation}</p>
                  <p className="text-gray-400 text-xs">{sellerTime}</p>
                </div>
              </div>

              {/* Route line */}
              <div className="flex items-center gap-1 mb-4 px-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <div className="flex-1 h-0.5 bg-gradient-to-r from-cyan-400 to-emerald-400" />
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 border-2 border-gray-900 flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full" />
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-400/60" />
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="flex justify-between text-xs text-gray-500 px-1 mb-4">
                <span>{buyerStation}</span>
                <span className="text-white font-medium">{result.station} (meetup)</span>
                <span>{sellerStation}</span>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Zap size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium mb-1">AI Reasoning</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{result.reasoning}</p>
                  </div>
                </div>
              </div>

              {/* Map section */}
              <div className="mb-4">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-all"
                >
                  <Map size={14} /> {showMap ? 'Hide Map' : 'View on Map'}
                </button>
                <AnimatePresence>
                  {showMap && meetupStation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden rounded-xl border border-white/10"
                    >
                      <iframe
                        title="Meetup Location Map"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - 0.05},${mapCenter.lat - 0.03},${mapCenter.lng + 0.05},${mapCenter.lat + 0.03}&layer=mapnik&marker=${meetupStation.lat},${meetupStation.lng}`}
                        className="w-full h-64 border-0"
                        loading="lazy"
                      />
                      <div className="bg-gray-900/80 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-emerald-400" />
                          <p className="text-white text-sm font-medium">{meetupStation.name} Station</p>
                        </div>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${meetupStation.lat}&mlon=${meetupStation.lng}#map=15/${meetupStation.lat}/${meetupStation.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors flex items-center gap-1"
                        >
                          Open in full map <ArrowRight size={10} />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-all">
                  <CheckCircle size={14} /> Confirm Meetup
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example scenarios */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-gray-900/40 border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-sm font-medium mb-3">Example Scenarios</p>
          <div className="space-y-3">
            {[
              { buyer: 'Kamalapur', bTime: '18:00', seller: 'Airport', sTime: '19:00' },
              { buyer: 'Uttara', bTime: '14:00', seller: 'Narayanganj', sTime: '15:30' },
              { buyer: 'Tongi', bTime: '10:00', seller: 'Tejgaon', sTime: '11:00' },
            ].map((ex, i) => (
              <button
                key={i}
                onClick={() => { setBuyerStation(ex.buyer); setBuyerTime(ex.bTime); setSellerStation(ex.seller); setSellerTime(ex.sTime); }}
                className="w-full flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/60 border border-white/5 rounded-lg transition-all text-left"
              >
                <span className="text-cyan-400 text-sm">{ex.buyer} ({ex.bTime})</span>
                <ArrowRight size={12} className="text-gray-600" />
                <span className="text-emerald-400 text-sm">{ex.seller} ({ex.sTime})</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
