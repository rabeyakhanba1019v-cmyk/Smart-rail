import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Brain as Train, MapPin, Clock, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { SEAT_TYPES, BANGLADESH_STATIONS, TRAIN_NAMES, formatPrice } from '../utils/format';
import DashboardLayout from '../components/layout/DashboardLayout';

interface TicketForm {
  train_name: string;
  source: string;
  destination: string;
  journey_date: string;
  departure_time: string;
  seat_type: string;
  coach: string;
  pnr: string;
  price: string;
  original_price: string;
  quantity: string;
  meetup_available: boolean;
  preferred_station: string;
  available_meetup_time: string;
}

const defaultForm: TicketForm = {
  train_name: '', source: '', destination: '', journey_date: '', departure_time: '',
  seat_type: 'S_CHAIR', coach: '', pnr: '', price: '', original_price: '', quantity: '1',
  meetup_available: true, preferred_station: '', available_meetup_time: '',
};

export default function UploadTicketPage() {
  const [form, setForm] = useState<TicketForm>(defaultForm);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const update = (field: keyof TicketForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => {
      const newValue = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
      const updated = { ...prev, [field]: newValue };

      // Auto-set preferred station to source station
      if (field === 'source' && newValue && !prev.preferred_station) {
        updated.preferred_station = newValue;
      }

      return updated;
    });
  };

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast('error', 'Invalid file', 'Please upload an image.'); return; }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.train_name || !form.source || !form.destination || !form.journey_date || !form.price) {
      toast('error', 'Missing Fields', 'Please fill all required fields.'); return;
    }
    if (form.source === form.destination) {
      toast('error', 'Invalid Route', 'From and To stations cannot be the same.'); return;
    }
    setSubmitting(true);

    let imageUrl = '';
    if (image) {
      const ext = image.name.split('.').pop();
      const path = `tickets/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('ticket-images').upload(path, image);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('ticket-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('tickets').insert({
      user_id: user.id,
      train_name: form.train_name,
      source: form.source,
      destination: form.destination,
      journey_date: form.journey_date,
      departure_time: form.departure_time,
      seat_type: form.seat_type,
      coach: form.coach,
      pnr: form.pnr,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : 0,
      verification_status: 'pending',
      image_url: imageUrl,
      meetup_available: form.meetup_available,
      preferred_station: form.preferred_station,
      available_meetup_time: form.available_meetup_time,
      quantity: Number(form.quantity),
      quantity_available: Number(form.quantity),
      status: 'active',
    });

    setSubmitting(false);
    if (error) {
      toast('error', 'Upload Failed', error.message);
    } else {
      toast('success', 'Ticket Listed!', 'Your ticket is pending verification.');
      navigate('/dashboard');
    }
  };

  const seatLabel = SEAT_TYPES.find(s => s.value === form.seat_type)?.label || form.seat_type;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Sell a Ticket</h1>
          <p className="text-gray-500 text-sm mt-1">List your railway ticket on the marketplace</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image upload */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Upload size={16} className="text-cyan-400" /> Ticket Image
            </h2>
            {!imagePreview ? (
              <div
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-cyan-400 bg-cyan-500/5' : 'border-white/10 hover:border-cyan-500/40 hover:bg-white/2'
                }`}
              >
                <Upload size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-300 font-medium text-sm">Drop ticket image here or click to upload</p>
                <p className="text-gray-600 text-xs mt-1">PNG, JPG, WEBP up to 10MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img src={imagePreview} alt="Ticket preview" className="w-full max-h-64 object-contain bg-gray-800 rounded-xl" />
                  <button type="button" onClick={() => { setImage(null); setImagePreview(''); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Train details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Train size={16} className="text-cyan-400" /> Train Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-gray-400 text-xs mb-1.5">Train Name *</label>
                <select value={form.train_name} onChange={update('train_name')} required
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white outline-none transition-all">
                  <option value="">Select Train</option>
                  {TRAIN_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">From Station *</label>
                <select value={form.source} onChange={update('source')} required
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white outline-none transition-all">
                  <option value="">Select Station</option>
                  {BANGLADESH_STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">To Station *</label>
                <select value={form.destination} onChange={update('destination')} required
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white outline-none transition-all">
                  <option value="">Select Station</option>
                  {BANGLADESH_STATIONS.filter(s => s !== form.source).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Journey Date *</label>
                <input type="date" value={form.journey_date} onChange={update('journey_date')} min={today} required
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white outline-none transition-all" />
                <p className="text-gray-500 text-xs mt-1">Must be today or a future date</p>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Departure Time</label>
                <input type="time" value={form.departure_time} onChange={update('departure_time')}
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white outline-none transition-all" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Seat Type *</label>
                <select value={form.seat_type} onChange={update('seat_type')}
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white outline-none transition-all">
                  {SEAT_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Coach</label>
                <input type="text" value={form.coach} onChange={update('coach')} placeholder="e.g. KHA-1"
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 flex justify-between items-center">
                  PNR Number
                  <button
                    type="button"
                    onClick={() => {
                      const randomPnr = 'BD' + Math.floor(Math.random() * 9000000 + 1000000);
                      setForm(prev => ({ ...prev, pnr: randomPnr }));
                    }}
                    className="text-cyan-400 hover:text-cyan-300 text-[10px] font-bold uppercase tracking-wider bg-cyan-400/10 px-1.5 py-0.5 rounded transition-all"
                  >
                    Generate
                  </button>
                </label>
                <input type="text" value={form.pnr} onChange={update('pnr')} placeholder="BD1234567"
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all" />
              </div>
            </div>
          </motion.div>

          {/* Pricing & Quantity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Pricing & Quantity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Your Selling Price (৳) *</label>
                <input type="number" value={form.price} onChange={update('price')} placeholder="e.g. 650" required
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Original Ticket Price (৳)</label>
                <input type="number" value={form.original_price} onChange={update('original_price')} placeholder="e.g. 450"
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all" />
              </div>
              <div className="col-span-2">
                <label className="block text-gray-400 text-xs mb-1.5">Quantity Available *</label>
                <input type="number" value={form.quantity} onChange={update('quantity')} min="1" placeholder="e.g. 1" required
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all" />
                <p className="text-gray-500 text-xs mt-1">How many tickets are you selling?</p>
              </div>
            </div>
          </motion.div>

          {/* Meetup */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <MapPin size={16} className="text-emerald-400" /> Meetup Details
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-gray-400 text-sm">Available for meetup</span>
                <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form.meetup_available ? 'bg-emerald-500' : 'bg-gray-700'}`}
                  onClick={() => setForm(prev => ({ ...prev, meetup_available: !prev.meetup_available }))}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${form.meetup_available ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>
            <AnimatePresence>
              {form.meetup_available && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1.5">Preferred Station</label>
                    <select value={form.preferred_station} onChange={update('preferred_station')}
                      className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-emerald-500/50 rounded-lg text-sm text-white outline-none transition-all">
                      <option value="">Any Station</option>
                      {BANGLADESH_STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1.5 flex items-center gap-1">
                      <Clock size={10} /> Available Time
                    </label>
                    <input type="time" value={form.available_meetup_time} onChange={update('available_meetup_time')}
                      className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-emerald-500/50 rounded-lg text-sm text-white outline-none transition-all" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Review summary */}
          {form.train_name && form.source && form.destination && form.price && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 border border-cyan-500/20 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Eye size={16} className="text-cyan-400" /> Listing Preview
              </h2>

              <div className="flex items-start gap-4 mb-4">
                {imagePreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                    <img src={imagePreview} alt="Ticket" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-bold text-lg">{form.train_name}</p>
                  <p className="text-gray-400 text-sm">{form.source} → {form.destination}</p>
                  <p className="text-cyan-400 font-bold text-xl mt-1">{formatPrice(Number(form.price))}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-gray-900/50 rounded-lg p-2">
                  <p className="text-gray-500">Date</p>
                  <p className="text-white font-medium">{form.journey_date || 'Not set'}</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2">
                  <p className="text-gray-500">Time</p>
                  <p className="text-white font-medium">{form.departure_time || 'Not set'}</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2">
                  <p className="text-gray-500">Seat</p>
                  <p className="text-white font-medium">{seatLabel}</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2">
                  <p className="text-gray-500">Coach</p>
                  <p className="text-white font-medium">{form.coach || 'N/A'}</p>
                </div>
                {form.pnr && (
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <p className="text-gray-500">PNR</p>
                    <p className="text-white font-medium font-mono">{form.pnr}</p>
                  </div>
                )}
                {form.original_price && (
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <p className="text-gray-500">Original Price</p>
                    <p className="text-white font-medium">{formatPrice(Number(form.original_price))}</p>
                  </div>
                )}
                {form.meetup_available && (
                  <div className="bg-gray-900/50 rounded-lg p-2 col-span-2">
                    <p className="text-gray-500">Meetup</p>
                    <p className="text-white font-medium">{form.preferred_station || 'Flexible'} {form.available_meetup_time ? `at ${form.available_meetup_time}` : ''}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Submit button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="submit"
            disabled={submitting || !form.train_name || !form.source || !form.destination || !form.journey_date || !form.price}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 text-lg"
          >
            {submitting ? <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" /> : <><Upload size={20} /> Publish Ticket</>}
          </motion.button>
        </form>
      </div>
    </DashboardLayout>
  );
}
