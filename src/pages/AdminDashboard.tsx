import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Ticket, AlertTriangle, TrendingUp, Shield, CheckCircle, XCircle, Eye, Flag, ThumbsDown, MessageSquare, ChevronDown, ChevronUp, UserX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile, Ticket as TicketType, FraudReport } from '../types';
import { formatPrice, formatDate, timeAgo } from '../utils/format';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToast } from '../components/ui/Toast';
import { supabaseAdmin } from '../lib/supabase';

const adminDb = () => supabaseAdmin || supabase;

// Refund buyer: adds balance back, corrects total_spent — uses admin client to bypass RLS
async function adminRefundWallet(userId: string, amount: number) {
  const { data: current } = await adminDb().from('wallets').select('balance, total_spent').eq('user_id', userId).single();
  await adminDb().from('wallets').update({
    balance: (current?.balance ?? 0) + amount,
    total_spent: Math.max(0, (current?.total_spent ?? 0) - amount),
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
}

// Claw back seller: deducts balance and total_earned — no balance check, floors at 0
async function forceDeductWallet(userId: string, amount: number) {
  const { data: current } = await adminDb().from('wallets').select('balance, total_earned').eq('user_id', userId).single();
  await adminDb().from('wallets').update({
    balance: Math.max(0, (current?.balance ?? 0) - amount),
    total_earned: Math.max(0, (current?.total_earned ?? 0) - amount),
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
}

// Always fetch fresh and use admin client to bypass RLS
async function deductTrustPoints(userId: string, points: number) {
  const client = supabaseAdmin || supabase;
  const { data } = await client.from('profiles').select('trust_points').eq('id', userId).single();
  const newPoints = Math.max(0, (data?.trust_points ?? 100) - points);
  await client.from('profiles').update({ trust_points: newPoints }).eq('id', userId);

  if (newPoints === 0 && supabaseAdmin) {
    // 1. Refund all buyers who paid this seller for sold tickets
    const { data: soldTickets } = await supabaseAdmin
      .from('tickets')
      .select('id, buyer_id, price, train_name')
      .eq('user_id', userId)
      .eq('status', 'sold')
      .not('buyer_id', 'is', null);

    if (soldTickets?.length) {
      for (const t of soldTickets) {
        const { data: bw } = await supabaseAdmin.from('wallets').select('balance, total_spent').eq('user_id', t.buyer_id).single();
        if (bw) {
          await supabaseAdmin.from('wallets').update({
            balance: bw.balance + t.price,
            total_spent: Math.max(0, (bw.total_spent ?? 0) - t.price),
            updated_at: new Date().toISOString(),
          }).eq('user_id', t.buyer_id);
        }
        await supabaseAdmin.from('notifications').insert({
          user_id: t.buyer_id,
          title: 'Refund Issued — Seller Removed',
          message: `The seller of "${t.train_name}" has been removed from the platform due to trust violations. You have been refunded ${t.price}৳.`,
          type: 'success',
          link: '/dashboard',
        });
      }
    }

    // 2. Delete the auth user (cascades: profile → tickets → related records)
    await supabaseAdmin.auth.admin.deleteUser(userId);
  }

  return newPoints;
}

async function banUser(userId: string) {
  if (!supabaseAdmin) throw new Error('Admin client not available');
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, tickets: 0, orders: 0, fraudReports: 0 });
  const [users, setUsers] = useState<Profile[]>([]);
  const [pendingTickets, setPendingTickets] = useState<TicketType[]>([]);
  const [fraudReports, setFraudReports] = useState<FraudReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tickets' | 'fraud'>('overview');
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [fixingRefunds, setFixingRefunds] = useState(false);
  const [fixResult, setFixResult] = useState<{ fixed: number; skipped: number } | null>(null);
  const { toast } = useToast();

  const handleFixPendingRefunds = async () => {
    setFixingRefunds(true);
    setFixResult(null);
    let fixed = 0;
    let skipped = 0;

    try {
      // All flagged tickets that have a buyer (purchase happened)
      const { data: flaggedTickets } = await adminDb()
        .from('tickets')
        .select('id, buyer_id, user_id, price, train_name')
        .eq('status', 'flagged')
        .not('buyer_id', 'is', null);

      if (!flaggedTickets?.length) {
        setFixResult({ fixed: 0, skipped: 0 });
        setFixingRefunds(false);
        return;
      }

      for (const ticket of flaggedTickets) {
        // Check if refund notification was already sent to this buyer for this ticket
        const { data: existing } = await adminDb()
          .from('notifications')
          .select('id')
          .eq('user_id', ticket.buyer_id)
          .eq('title', 'Payment Refunded (Fraud Detected)')
          .ilike('message', `%${ticket.train_name}%`)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Process refund
        await adminRefundWallet(ticket.buyer_id, ticket.price);
        await forceDeductWallet(ticket.user_id, ticket.price);
        await adminDb().from('notifications').insert([
          {
            user_id: ticket.buyer_id,
            title: 'Payment Refunded (Fraud Detected)',
            message: `You have been refunded ${formatPrice(ticket.price)} for ticket "${ticket.train_name}" because it was confirmed as fraud.`,
            type: 'success',
            link: '/dashboard',
          },
          {
            user_id: ticket.user_id,
            title: 'Funds Clawed Back (Fraud Confirmed)',
            message: `The payment for your listing "${ticket.train_name}" has been reversed because it was confirmed as fraudulent.`,
            type: 'fraud',
            link: '/dashboard',
          },
        ]);
        fixed++;
      }

      setFixResult({ fixed, skipped });
      if (fixed > 0) {
        toast('success', 'Refunds Processed', `${fixed} wallet refund${fixed !== 1 ? 's' : ''} applied successfully.`);
      } else {
        toast('info', 'Nothing to Fix', 'All flagged tickets were already refunded.');
      }
    } catch (err: unknown) {
      toast('error', 'Fix Failed', err instanceof Error ? err.message : 'Unknown error');
    }

    setFixingRefunds(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [
        { count: userCount },
        { count: ticketCount },
        { count: orderCount },
        { count: fraudCount },
        { data: usersData },
        { data: ticketsData },
        { data: fraudData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('fraud_reports').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('tickets').select('*, profiles(*)').eq('verification_status', 'pending').order('created_at', { ascending: false }).limit(10),
        supabase.from('fraud_reports')
          .select('*, reporter:profiles!fraud_reports_reporter_id_fkey(*), reported_user:profiles!fraud_reports_reported_user_id_fkey(*), reported_ticket:tickets(*)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      setStats({
        users: userCount || 0,
        tickets: ticketCount || 0,
        orders: orderCount || 0,
        fraudReports: fraudCount || 0,
      });
      setUsers((usersData as Profile[]) || []);
      setPendingTickets((ticketsData as TicketType[]) || []);
      setFraudReports((fraudData as FraudReport[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleBanUser = async (userId: string, userName: string) => {
    if (!supabaseAdmin) {
      toast('error', 'Admin Unavailable', 'Service role key is not configured.');
      return;
    }
    setProcessing(userId);
    try {
      await banUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast('success', 'User Banned', `${userName} has been permanently banned.`);
    } catch (err: unknown) {
      toast('error', 'Ban Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProcessing(null);
    }
  };

  const verifyTicket = async (ticketId: string, status: 'verified' | 'rejected') => {
    await supabase.from('tickets').update({ verification_status: status }).eq('id', ticketId);
    setPendingTickets(prev => prev.filter(t => t.id !== ticketId));
    toast('success', `Ticket ${status}`, `Ticket has been ${status} successfully.`);
  };

  const handleFraudVerdict = async (reportId: string, verdict: 'confirmed_fraud' | 'false_report') => {
    setProcessing(reportId);
    const report = fraudReports.find(r => r.id === reportId);
    if (!report) { setProcessing(null); return; }

    const notes = adminNotes[reportId] || '';

    // Get current admin user id
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) { setProcessing(null); return; }

    // Update the fraud report
    const { error: reportError } = await supabase.from('fraud_reports').update({
      status: 'resolved',
      admin_verdict: verdict,
      admin_notes: notes,
      admin_id: adminUser.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', reportId);

    if (reportError) {
      toast('error', 'Update Failed', reportError.message);
      setProcessing(null);
      return;
    }

    if (verdict === 'confirmed_fraud') {
      // Flag the reported ticket if exists
      if (report.reported_ticket_id) {
        // Fetch ticket data BEFORE flagging — status changes to 'flagged' after this
        const { data: ticketData } = await supabase
          .from('tickets')
          .select('buyer_id, user_id, price')
          .eq('id', report.reported_ticket_id)
          .maybeSingle();

        await supabase.from('tickets').update({ status: 'flagged' }).eq('id', report.reported_ticket_id);

        // --- AUTOMATED REFUND SYSTEM ---
        // 1. Check orders table for escrow-based purchases
        const { data: relatedOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('ticket_id', report.reported_ticket_id)
          .neq('payment_status', 'refunded');

        if (relatedOrders && relatedOrders.length > 0) {
          for (const order of relatedOrders) {
            await adminRefundWallet(order.buyer_id, order.amount);
            await forceDeductWallet(order.seller_id, order.amount);
            await supabase.from('orders').update({
              payment_status: 'refunded',
              escrow_status: 'refunded',
              updated_at: new Date().toISOString()
            }).eq('id', order.id);
            await supabase.from('notifications').insert([
              {
                user_id: order.buyer_id,
                title: 'Payment Refunded (Fraud Detected)',
                message: `You have been refunded ${formatPrice(order.amount)} for ticket ${report.reported_ticket?.train_name || 'Railway Ticket'} because it was confirmed as fraud.`,
                type: 'success',
                link: '/dashboard'
              },
              {
                user_id: order.seller_id,
                title: 'Funds Clawed Back (Fraud Confirmed)',
                message: `The payment for order #${order.id.slice(0, 8)} has been reversed because the listing was confirmed as fraudulent.`,
                type: 'fraud',
                link: '/dashboard'
              }
            ]);
          }
        } else if (ticketData?.buyer_id) {
          // 2. Fallback: ticket sold via purchase request (no order record)
          // Use pre-fetched ticketData — status is now 'flagged' so we can't query by status
          await adminRefundWallet(ticketData.buyer_id, ticketData.price);
          await forceDeductWallet(ticketData.user_id, ticketData.price);
          await supabase.from('notifications').insert([
            {
              user_id: ticketData.buyer_id,
              title: 'Payment Refunded (Fraud Detected)',
              message: `You have been refunded ${formatPrice(ticketData.price)} for ticket ${report.reported_ticket?.train_name || 'Railway Ticket'} because it was confirmed as fraud.`,
              type: 'success',
              link: '/dashboard'
            },
            {
              user_id: ticketData.user_id,
              title: 'Funds Clawed Back (Fraud Confirmed)',
              message: `The payment for your listing "${report.reported_ticket?.train_name}" has been reversed because it was confirmed as fraudulent.`,
              type: 'fraud',
              link: '/dashboard'
            }
          ]);
        } else {
          // 3. No buyer found — ticket was never purchased, just flag it (no wallet action needed)
          void 0;
        }
      }
      // Notify the reporter that their report was confirmed
      if (report.reporter_id) {
        await supabase.from('notifications').insert({
          user_id: report.reporter_id,
          title: 'Fraud Report Confirmed',
          message: 'Your fraud report has been reviewed and confirmed by an admin. Thank you for keeping the platform safe.',
          type: 'success',
        });
      }
      // Deduct 10 trust points from the fraud seller
      const sellerTicket = await supabase.from('tickets').select('user_id').eq('id', report.reported_ticket_id).maybeSingle();
      const sellerId = sellerTicket?.data?.user_id || report.reported_user_id;
      if (sellerId) {
        const newSellerPoints = await deductTrustPoints(sellerId, 10);
        if (newSellerPoints > 0) {
          await supabase.from('notifications').insert({
            user_id: sellerId,
            title: 'Trust Points Deducted (Fraud Confirmed)',
            message: `10 trust points have been deducted from your account because your listing was confirmed as fraudulent. New trust points: ${newSellerPoints}.`,
            type: 'fraud',
            link: '/profile',
          });
        }
      }
      toast('success', 'Fraud Confirmed', 'Ticket flagged, refund issued, and 10 trust points deducted from seller.');
    } else {
      // False report: deduct 10 trust points from the reporter
      const newReporterPoints = await deductTrustPoints(report.reporter_id, 10);
      await supabase.from('notifications').insert({
        user_id: report.reporter_id,
        title: 'False Report Penalty',
        message: `Your fraud report was reviewed and found to be false. 10 trust points have been deducted. New trust points: ${newReporterPoints}.`,
        type: 'warning',
      });
      if (report.reported_user_id) {
        await supabase.from('notifications').insert({
          user_id: report.reported_user_id,
          title: 'Report Dismissed',
          message: 'A fraud report against you has been reviewed and dismissed by an admin. No action was taken against your account.',
          type: 'info',
        });
      }
      toast('success', 'False Report', 'The report has been marked as false. 10 trust points deducted from the reporter.');
    }

    setFraudReports(prev => prev.filter(r => r.id !== reportId));
    setExpandedReport(null);
    setProcessing(null);
  };

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Shield size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-500 text-sm">Platform management and monitoring</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.users.toLocaleString()} icon={<Users size={20} />} color="cyan" />
          <StatCard label="Total Tickets" value={stats.tickets.toLocaleString()} icon={<Ticket size={20} />} color="emerald" />
          <StatCard label="Total Orders" value={stats.orders.toLocaleString()} icon={<TrendingUp size={20} />} color="yellow" />
          <StatCard label="Fraud Reports" value={stats.fraudReports.toLocaleString()} icon={<AlertTriangle size={20} />} color="red" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/5 pb-0">
          {(['overview', 'users', 'tickets', 'fraud'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {tab === 'fraud' && fraudReports.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  Fraud <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{fraudReports.length}</span>
                </span>
              )}
              {tab !== 'fraud' && tab}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

          {/* Data Repair — fix wallets for already-flagged tickets */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold text-sm">Fix Pending Fraud Refunds</p>
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                    Finds all flagged tickets whose buyers were never refunded and corrects their wallet balances now.
                  </p>
                  {fixResult && (
                    <p className={`text-xs mt-1.5 font-medium ${fixResult.fixed > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {fixResult.fixed > 0
                        ? `✓ ${fixResult.fixed} refund${fixResult.fixed !== 1 ? 's' : ''} applied, ${fixResult.skipped} already done`
                        : `All ${fixResult.skipped} flagged ticket${fixResult.skipped !== 1 ? 's' : ''} already refunded`}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleFixPendingRefunds}
                disabled={fixingRefunds}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {fixingRefunds ? (
                  <><div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" /> Running…</>
                ) : (
                  <><Shield size={14} /> Run Fix</>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900/60 border border-white/5 rounded-xl">
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-white font-semibold">Platform Health</h2>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'System Status', value: 'Operational', color: 'text-emerald-400' },
                  { label: 'Realtime Chat', value: 'Active', color: 'text-emerald-400' },
                  { label: 'Escrow System', value: 'Active', color: 'text-emerald-400' },
                  { label: 'Pending Verifications', value: pendingTickets.length, color: pendingTickets.length > 0 ? 'text-yellow-400' : 'text-emerald-400' },
                  { label: 'Open Fraud Reports', value: fraudReports.length, color: fraudReports.length > 0 ? 'text-red-400' : 'text-emerald-400' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/3">
                    <span className="text-gray-400 text-sm">{item.label}</span>
                    <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/60 border border-white/5 rounded-xl">
              <div className="p-5 border-b border-white/5">
                <h2 className="text-white font-semibold">Quick Stats</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Verified Tickets', value: Math.floor(stats.tickets * 0.72), color: 'text-emerald-400' },
                    { label: 'Pending Review', value: pendingTickets.length, color: 'text-yellow-400' },
                    { label: 'Active Users', value: Math.floor(stats.users * 0.85), color: 'text-cyan-400' },
                    { label: 'Reports Resolved', value: Math.floor(stats.fraudReports * 0.8), color: 'text-emerald-400' },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-xl p-4 text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
                      <p className="text-gray-500 text-xs mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900/60 border border-white/5 rounded-xl">
            <div className="p-5 border-b border-white/5">
              <h2 className="text-white font-semibold">User Management ({stats.users} total)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-gray-500 font-medium p-4">User</th>
                    <th className="text-left text-gray-500 font-medium p-4 hidden sm:table-cell">Phone</th>
                    <th className="text-left text-gray-500 font-medium p-4">Role</th>
                    <th className="text-left text-gray-500 font-medium p-4">Trust</th>
                    <th className="text-left text-gray-500 font-medium p-4 hidden md:table-cell">Joined</th>
                    <th className="text-left text-gray-500 font-medium p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-gray-950">
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{u.name}</p>
                            <p className="text-gray-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400 text-xs hidden sm:table-cell">{u.phone || '-'}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-gray-700 text-gray-300'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${(u.trust_points ?? 100) >= 80 ? 'text-emerald-400' : (u.trust_points ?? 100) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {u.trust_points ?? 100} pts
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 text-xs hidden md:table-cell">{formatDate(u.created_at)}</td>
                      <td className="p-4">
                        {(u.trust_points ?? 100) === 0 && u.role !== 'admin' ? (
                          <button
                            onClick={() => handleBanUser(u.id, u.name)}
                            disabled={processing === u.id}
                            title="Ban user (trust points = 0)"
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                          >
                            {processing === u.id ? (
                              <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                              <><UserX size={12} /> Ban</>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-700 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Tickets tab */}
        {activeTab === 'tickets' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900/60 border border-white/5 rounded-xl">
            <div className="p-5 border-b border-white/5">
              <h2 className="text-white font-semibold">Pending Ticket Verification ({pendingTickets.length})</h2>
            </div>
            {pendingTickets.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-gray-400">All tickets are verified!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {pendingTickets.map(ticket => (
                  <div key={ticket.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{ticket.train_name}</p>
                      <p className="text-gray-500 text-xs">{ticket.source} to {ticket.destination} | {formatDate(ticket.journey_date)}</p>
                      <p className="text-gray-600 text-xs">PNR: {ticket.pnr || 'N/A'} | {formatPrice(ticket.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link to={`/ticket/${ticket.id}`} className="p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => verifyTicket(ticket.id, 'verified')} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs transition-all">
                        <CheckCircle size={12} /> Verify
                      </button>
                      <button onClick={() => verifyTicket(ticket.id, 'rejected')} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-all">
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Fraud tab */}
        {activeTab === 'fraud' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-gradient-to-r from-red-500/10 to-yellow-500/10 border border-red-500/20 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold text-sm mb-1">Admin Fraud Review</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Review each report carefully. If you <span className="text-red-400 font-medium">Confirm Fraud</span>, the reported ticket will be flagged and the reporter will be thanked.
                    If you mark it as a <span className="text-yellow-400 font-medium">False Report</span>, the reporter will lose 10 trust points as a penalty for wasting review time.
                  </p>
                </div>
              </div>
            </div>

            {fraudReports.length === 0 ? (
              <div className="bg-gray-900/60 border border-white/5 rounded-xl p-12 text-center">
                <Shield size={32} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-gray-400">No pending fraud reports!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fraudReports.map(report => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900/60 border border-white/5 rounded-xl overflow-hidden"
                  >
                    {/* Report header - always visible */}
                    <div
                      className="p-4 cursor-pointer hover:bg-white/2 transition-colors"
                      onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Flag size={14} className="text-red-400 flex-shrink-0" />
                            <p className="text-white text-sm font-medium truncate">{report.reason}</p>
                          </div>
                          <p className="text-gray-500 text-xs truncate">{report.description || 'No additional details provided.'}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-gray-600 text-xs">{timeAgo(report.created_at)}</span>
                            {report.reporter && (
                              <span className="text-cyan-400/70 text-xs">By: {report.reporter.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {expandedReport === report.id ? (
                            <ChevronUp size={16} className="text-gray-500" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {expandedReport === report.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/5 p-5 space-y-4">
                            {/* Reporter info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-800/40 rounded-lg p-3">
                                <p className="text-gray-500 text-xs mb-1.5 flex items-center gap-1">
                                  <MessageSquare size={10} /> Reporter
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-gray-950">
                                    {report.reporter?.name?.[0]?.toUpperCase() || '?'}
                                  </div>
                                  <div>
                                    <p className="text-white text-sm font-medium">{report.reporter?.name || 'Unknown'}</p>
                                    <p className="text-gray-500 text-xs">Trust Points: <span className={`font-medium ${(report.reporter?.trust_points ?? 100) >= 80 ? 'text-emerald-400' : (report.reporter?.trust_points ?? 100) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{report.reporter?.trust_points ?? 100}</span></p>
                                  </div>
                                </div>
                              </div>

                              {/* Reported user info */}
                              {report.reported_user && (
                                <div className="bg-gray-800/40 rounded-lg p-3">
                                  <p className="text-gray-500 text-xs mb-1.5 flex items-center gap-1">
                                    <AlertTriangle size={10} /> Reported User
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-xs font-bold text-gray-950">
                                      {report.reported_user.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                      <p className="text-white text-sm font-medium">{report.reported_user.name}</p>
                                      <p className="text-gray-500 text-xs">Trust Points: <span className={`font-medium ${(report.reported_user.trust_points ?? 100) >= 80 ? 'text-emerald-400' : (report.reported_user.trust_points ?? 100) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{report.reported_user.trust_points ?? 100}</span></p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Full description */}
                            <div>
                              <p className="text-gray-500 text-xs mb-1.5">Full Description</p>
                              <p className="text-gray-300 text-sm leading-relaxed bg-gray-800/30 rounded-lg p-3">
                                {report.description || 'No additional details provided.'}
                              </p>
                            </div>

                            {/* Evidence image */}
                            {report.evidence_image && (
                              <div>
                                <p className="text-gray-500 text-xs mb-1.5">Evidence Image</p>
                                <img
                                  src={report.evidence_image}
                                  alt="Evidence"
                                  className="max-w-xs rounded-lg border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(report.evidence_image, '_blank')}
                                />
                              </div>
                            )}

                            {/* Reported ticket info */}
                            {report.reported_ticket && (
                              <div>
                                <p className="text-gray-500 text-xs mb-1.5">Reported Ticket</p>
                                <div className="bg-gray-800/30 rounded-lg p-3">
                                  <p className="text-white text-sm font-medium">{report.reported_ticket.train_name}</p>
                                  <p className="text-gray-500 text-xs">{report.reported_ticket.source} to {report.reported_ticket.destination} | {formatPrice(report.reported_ticket.price)}</p>
                                  <Link
                                    to={`/ticket/${report.reported_ticket.id}`}
                                    className="inline-flex items-center gap-1 text-cyan-400 text-xs mt-1 hover:text-cyan-300 transition-colors"
                                  >
                                    <Eye size={10} /> View Ticket
                                  </Link>
                                </div>
                              </div>
                            )}

                            {/* Admin notes */}
                            <div>
                              <p className="text-gray-500 text-xs mb-1.5">Admin Notes (optional)</p>
                              <textarea
                                value={adminNotes[report.id] || ''}
                                onChange={e => setAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                                placeholder="Add your review notes..."
                                rows={2}
                                className="w-full px-3 py-2 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all resize-none"
                              />
                            </div>

                            {/* Verdict buttons */}
                            <div className="flex gap-3 pt-2">
                              <button
                                onClick={() => handleFraudVerdict(report.id, 'confirmed_fraud')}
                                disabled={processing === report.id}
                                className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {processing === report.id ? (
                                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                ) : (
                                  <><Flag size={14} /> Confirm Fraud</>
                                )}
                              </button>
                              <button
                                onClick={() => handleFraudVerdict(report.id, 'false_report')}
                                disabled={processing === report.id}
                                className="flex-1 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {processing === report.id ? (
                                  <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                                ) : (
                                  <><ThumbsDown size={14} /> False Report (-10 pts)</>
                                )}
                              </button>
                            </div>

                            {/* Penalty warning */}
                            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 flex items-start gap-2">
                              <AlertTriangle size={12} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                              <p className="text-gray-500 text-xs leading-relaxed">
                                Marking as <span className="text-yellow-400">False Report</span> will deduct 10 trust points from the reporter.
                                Marking as <span className="text-red-400">Confirmed Fraud</span> will deduct 10 trust points from the seller, flag the ticket, and refund the buyer. If trust points reach 0, the account is permanently removed.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
