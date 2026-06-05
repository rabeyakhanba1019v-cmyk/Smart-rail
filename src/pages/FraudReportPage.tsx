import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flag, AlertTriangle, Upload, CheckCircle, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import DashboardLayout from '../components/layout/DashboardLayout';

const REPORT_REASONS = [
  'Fake ticket / Forged document',
  'Edited screenshot',
  'Duplicate listing',
  'Wrong information',
  'Suspicious pricing',
  'Scam seller behavior',
  'Multiple listing abuse',
  'Other',
];

export default function FraudReportPage() {
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get('ticket');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    reason: '',
    description: '',
    pnr: '',
    ticket_id: ticketId || '',
    user_id: '',
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.reason) return;
    setSubmitting(true);

    let evidenceUrl = '';
    if (evidenceFile) {
      const path = `fraud-evidence/${user.id}/${Date.now()}-${evidenceFile.name}`;
      const { error: uploadError } = await supabase.storage.from('ticket-images').upload(path, evidenceFile);
      if (!uploadError) {
        const { data } = supabase.storage.from('ticket-images').getPublicUrl(path);
        evidenceUrl = data.publicUrl;
      }
    }

    // Resolve ticket ID from PNR if provided
    let resolvedTicketId = form.ticket_id || null;
    if (form.pnr && !form.ticket_id) {
      const { data: ticketByPnr } = await supabase
        .from('tickets')
        .select('id')
        .eq('pnr', form.pnr.trim())
        .maybeSingle();
      if (!ticketByPnr) {
        toast('error', 'Ticket Not Found', `No ticket found with PNR: ${form.pnr}`);
        setSubmitting(false);
        return;
      }
      resolvedTicketId = ticketByPnr.id;
    }

    const { error } = await supabase.from('fraud_reports').insert({
      reporter_id: user.id,
      reported_ticket_id: resolvedTicketId,
      reported_user_id: form.user_id || null,
      reason: form.reason,
      description: form.description,
      evidence_image: evidenceUrl,
      status: 'pending',
    });

    setSubmitting(false);
    if (error) {
      toast('error', 'Report Failed', error.message);
    } else {
      setSubmitted(true);
      toast('success', 'Report Submitted', 'Thank you for helping keep the platform safe.');
    }
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto pt-12 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Report Submitted</h2>
            <p className="text-gray-400 mb-6">
              Thank you for helping keep Bangladesh Railway Exchange safe. Our team will review your report within 24 hours.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-all">
                Go Back
              </button>
              <button onClick={() => navigate('/marketplace')} className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-gray-950 font-bold rounded-lg text-sm transition-all">
                Browse Marketplace
              </button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Flag size={18} className="text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Report Fraud</h1>
              <p className="text-gray-500 text-sm">Help keep our marketplace safe for everyone</p>
            </div>
          </div>
        </motion.div>

        {/* Info banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-semibold text-sm mb-1">Community Protection</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              All reports are reviewed by an admin. If the report is confirmed as fraud, the ticket will be flagged and removed.
              If the report is found to be <span className="text-yellow-300 font-medium">false</span>, you will lose <span className="text-yellow-300 font-medium">10 trust points</span> as a penalty.
              Please only report genuine fraud to keep the platform safe.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-gray-900/60 border border-white/5 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-semibold">Report Details</h3>

            <div>
              <label className="block text-gray-400 text-xs mb-1.5">Report Reason *</label>
              <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} required
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-red-500/50 rounded-lg text-sm text-white outline-none transition-all">
                <option value="">Select a reason</option>
                {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {!ticketId && (
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">PNR Number (optional)</label>
                <input type="text" value={form.pnr} onChange={e => setForm(p => ({ ...p, pnr: e.target.value }))}
                  placeholder="Enter the ticket PNR number"
                  className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-red-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all" />
              </div>
            )}

            {ticketId && (
              <div className="flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <Shield size={14} className="text-cyan-400" />
                <p className="text-cyan-400 text-sm">Reporting ticket: <span className="font-mono text-xs">{ticketId}</span></p>
              </div>
            )}

            <div>
              <label className="block text-gray-400 text-xs mb-1.5">Description *</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                required
                rows={4}
                placeholder="Describe the suspicious activity in detail..."
                className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-red-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1.5">Evidence (optional)</label>
              <div className="border-2 border-dashed border-white/10 hover:border-red-500/30 rounded-xl p-6 text-center cursor-pointer transition-all"
                onClick={() => document.getElementById('evidence-input')?.click()}>
                <Upload size={24} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  {evidenceFile ? evidenceFile.name : 'Upload screenshot or evidence image'}
                </p>
                <input id="evidence-input" type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && setEvidenceFile(e.target.files[0])} />
              </div>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            type="submit"
            disabled={!form.reason || !form.description || submitting}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
              <><Flag size={16} /> Submit Fraud Report</>}
          </motion.button>
        </form>
      </div>
    </DashboardLayout>
  );
}
