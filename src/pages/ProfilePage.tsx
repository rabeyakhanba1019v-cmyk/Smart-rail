import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, Star, Save, CreditCard as Edit3, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../utils/format';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: profile?.name || '', phone: profile?.phone || '', bio: profile?.bio || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      name: form.name,
      phone: form.phone,
      bio: form.bio,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);
    setSaving(false);
    if (error) {
      toast('error', 'Save Failed', error.message);
    } else {
      await refreshProfile();
      setEditing(false);
      toast('success', 'Profile Updated', 'Your changes have been saved.');
    }
  };

  if (!profile) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64 text-gray-500">Loading profile...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-sm rounded-lg transition-all"
          >
            {saving ? <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /> :
              editing ? <><Save size={14} /> Save Changes</> : <><Edit3 size={14} /> Edit Profile</>}
          </button>
        </motion.div>

        {/* Avatar section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-gray-900/60 border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-3xl font-bold text-gray-950 shadow-lg shadow-cyan-400/20">
                {profile.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-800 border border-white/10 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Camera size={12} className="text-gray-400" />
              </button>
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{profile.name}</h2>
              <p className="text-gray-500 text-sm">{profile.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${profile.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-gray-800 text-gray-400'}`}>
                  {profile.role}
                </span>
                {profile.verified && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Shield size={10} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Rating', value: profile.rating?.toFixed(1) || '5.0', icon: <Star size={16} fill="currentColor" />, color: 'text-yellow-400' },
            { label: 'Trust Points', value: `${profile.trust_points ?? 100}`, icon: <Shield size={16} />, color: (profile.trust_points ?? 100) >= 80 ? 'text-emerald-400' : (profile.trust_points ?? 100) >= 50 ? 'text-yellow-400' : 'text-red-400' },
            { label: 'Member Since', value: formatDate(profile.created_at), icon: <User size={16} />, color: 'text-emerald-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-900/60 border border-white/5 rounded-xl p-4 text-center">
              <span className={stat.color}>{stat.icon}</span>
              <p className={`font-bold text-lg mt-1 ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Trust points explanation */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="bg-gray-900/40 border border-white/5 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium mb-1">Trust Points</p>
              <p className="text-gray-500 text-xs leading-relaxed">
                You start with 100 trust points. Points are deducted when you submit a fraud report that is found to be false (-10 points per false report).
                Maintain a high trust score to keep full access to platform features.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Edit form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-gray-900/60 border border-white/5 rounded-xl p-6 space-y-5">
          <h3 className="text-white font-semibold">Account Details</h3>

          <div>
            <label className="block text-gray-400 text-xs mb-1.5 flex items-center gap-1"><User size={10} /> Full Name</label>
            {editing ? (
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white outline-none transition-all" />
            ) : (
              <p className="text-gray-200 text-sm py-2">{profile.name}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1.5 flex items-center gap-1"><Mail size={10} /> Email</label>
            <p className="text-gray-500 text-sm py-2">{profile.email} <span className="text-gray-700 text-xs">(cannot be changed)</span></p>
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1.5 flex items-center gap-1"><Phone size={10} /> Phone Number</label>
            {editing ? (
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white outline-none transition-all" />
            ) : (
              <p className="text-gray-200 text-sm py-2">{profile.phone || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1.5">Bio</label>
            {editing ? (
              <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                rows={3} placeholder="Tell other users about yourself..."
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all resize-none" />
            ) : (
              <p className="text-gray-200 text-sm py-2 leading-relaxed">{profile.bio || 'No bio yet.'}</p>
            )}
          </div>

          {editing && (
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 text-gray-950 font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" /> : <><Save size={14} /> Save Changes</>}
              </button>
              <button onClick={() => setEditing(false)} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-all">
                Cancel
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
