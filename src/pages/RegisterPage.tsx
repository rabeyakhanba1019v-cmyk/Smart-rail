import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain as Train, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (!form.phone.match(/^\+?[\d\s-]{10,}/)) e.phone = 'Valid phone number required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name, form.phone);
    setLoading(false);
    if (error) {
      toast('error', 'Registration failed', error.message);
      setErrors({ general: error.message });
    } else {
      toast('success', 'Account created!', 'Welcome to Bangladesh Railway Exchange.');
      navigate('/dashboard');
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const perks = ['AI fraud detection on all tickets', 'Escrow-protected payments', 'Smart meetup coordination', 'Realtime chat with sellers'];

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left panel */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center">
              <Train size={24} className="text-gray-950" />
            </div>
            <div>
              <p className="text-white font-bold">Bangladesh Railway</p>
              <p className="text-cyan-400 text-sm">Exchange</p>
            </div>
          </Link>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Trade Railway<br />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Tickets Safely</span>
          </h2>
          <p className="text-gray-400 mb-8">Join thousands of travelers using AI-powered security to buy and sell tickets.</p>
          <ul className="space-y-3">
            {perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <div className="text-center mb-6 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center">
                <Train size={20} className="text-gray-950" />
              </div>
              <p className="text-white font-bold">Bangladesh Railway Exchange</p>
            </Link>
          </div>

          <div className="bg-gray-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
            <p className="text-gray-400 text-sm mb-6">Start trading securely today</p>

            {errors.general && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={form.name} onChange={update('name')} placeholder="Mohammad Rahman"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all ${errors.name ? 'border-red-500/50' : 'border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30'}`} />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all ${errors.email ? 'border-red-500/50' : 'border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30'}`} />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+880 17XX XXX XXX"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all ${errors.phone ? 'border-red-500/50' : 'border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30'}`} />
                </div>
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Min. 6 characters"
                    className={`w-full pl-10 pr-10 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all ${errors.password ? 'border-red-500/50' : 'border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30'}`} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type={showPass ? 'text' : 'password'} value={form.confirm} onChange={update('confirm')} placeholder="Repeat password"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all ${errors.confirm ? 'border-red-500/50' : 'border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30'}`} />
                </div>
                {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" /> : <><User size={16} /> Create Account <ArrowRight size={16} /></>}
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
