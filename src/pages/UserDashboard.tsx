import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, ShoppingBag, TrendingUp, Shield, MessageSquare, Bell, ArrowRight, Clock, Star, CheckCircle, AlertTriangle, Upload, Trash2, CreditCard as Edit3, Eye, MoreVertical, X, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserTickets, usePurchasedTickets } from '../hooks/useTickets';
import { useWallet, addWalletBalance, rechargeWallet } from '../hooks/useWallet';
import { supabase } from '../lib/supabase';
import { Order, Notification as NotifType, Ticket as TicketType } from '../types';
import { formatPrice, formatDate, timeAgo } from '../utils/format';
import { useToast } from '../components/ui/Toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const { tickets, loading: ticketsLoading } = useUserTickets(user?.id);
  const { tickets: purchasedTickets, loading: purchasedLoading } = usePurchasedTickets(user?.id);
  const { wallet, loading: walletLoading } = useWallet(user?.id);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotifType[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'sold' | 'delete'; ticket: TicketType } | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [sellAllConfirm, setSellAllConfirm] = useState(false);
  const { toast } = useToast();

  const handleMarkSold = async (ticket: TicketType) => {
    setProcessing(true);
    const { error } = await supabase.from('tickets').update({ 
      status: 'sold',
      quantity_available: 0
    }).eq('id', ticket.id);
    if (error) {
      toast('error', 'Update Failed', error.message);
    } else {
      // Credit the wallet for manual sale
      await addWalletBalance(user!.id, ticket.price * ticket.quantity);
      toast('success', 'Ticket Marked as Sold', `${ticket.train_name} is now marked as sold and funds added to wallet.`);
    }
    setProcessing(false);
    setConfirmAction(null);
    setActionMenuId(null);
  };

  const handleDelete = async (ticket: TicketType) => {
    setProcessing(true);
    const { error } = await supabase.from('tickets').delete().eq('id', ticket.id);
    if (error) {
      toast('error', 'Delete Failed', error.message);
    } else {
      toast('success', 'Ticket Deleted', `${ticket.train_name} has been removed.`);
    }
    setProcessing(false);
    setConfirmAction(null);
    setActionMenuId(null);
  };

  const handleSellAllActive = async () => {
    setProcessing(true);
    const activeTickets = tickets.filter(t => t.status === 'active');
    if (activeTickets.length === 0) {
      toast('error', 'No Active Tickets', 'You have no active tickets to sell.');
      setProcessing(false);
      setSellAllConfirm(false);
      return;
    }
    const ids = activeTickets.map(t => t.id);
    const { error } = await supabase.from('tickets').update({ 
      status: 'sold',
      quantity_available: 0
    }).in('id', ids);
    if (error) {
      toast('error', 'Update Failed', error.message);
    } else {
      // Calculate total value of all tickets being sold
      const totalValue = activeTickets.reduce((sum, t) => sum + (t.price * t.quantity), 0);
      await addWalletBalance(user!.id, totalValue);
      toast('success', 'All Tickets Sold', `${activeTickets.length} tickets marked as sold and funds added to wallet.`);
    }
    setProcessing(false);
    setSellAllConfirm(false);
  };

  const handleRecharge = async () => {
    if (!user || !rechargeAmount || isNaN(Number(rechargeAmount))) return;
    setProcessing(true);
    const { error } = await rechargeWallet(user.id, Number(rechargeAmount));
    if (error) {
      toast('error', 'Recharge Failed', error.message);
    } else {
      toast('success', 'Wallet Recharged', `${formatPrice(Number(rechargeAmount))} has been added to your wallet.`);
      setShowRechargeModal(false);
      setRechargeAmount('');
      // Force reload to update wallet state (since we don't have a global state management for wallet)
      window.location.reload();
    }
    setProcessing(false);
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('orders').select('*, tickets(*)').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(5),
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ]).then(([{ data: ordersData }, { data: notifsData }]) => {
      setOrders((ordersData as Order[]) || []);
      setNotifications((notifsData as NotifType[]) || []);
      setOrdersLoading(false);
    });
  }, [user]);

  const activeListings = tickets.filter(t => t.status === 'active').length;
  const soldTickets = tickets.filter(t => t.status === 'sold').length;
  const totalEarnings = tickets.reduce((sum, t) => {
    // For legacy tickets or manual sales, if status is 'sold' but quantity_available 
    // is still equal to quantity, treat the whole quantity as sold.
    let soldCount = t.quantity - t.quantity_available;
    if (t.status === 'sold' && soldCount === 0 && t.quantity > 0) {
      soldCount = t.quantity;
    }
    return sum + (t.price * soldCount);
  }, 0);
  const purchasesCount = purchasedTickets.length;

  const notifIconMap: Record<string, React.ReactNode> = {
    success: <CheckCircle size={14} className="text-emerald-400" />,
    error: <AlertTriangle size={14} className="text-red-400" />,
    warning: <AlertTriangle size={14} className="text-yellow-400" />,
    fraud: <Shield size={14} className="text-red-400" />,
    payment: <TrendingUp size={14} className="text-emerald-400" />,
    chat: <MessageSquare size={14} className="text-cyan-400" />,
    info: <Bell size={14} className="text-cyan-400" />,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="text-cyan-400">{profile?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your tickets today.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Active Listings" value={activeListings} icon={<Ticket size={20} />} color="cyan" />
          <StatCard label="Tickets Sold" value={soldTickets} icon={<CheckCircle size={20} />} color="emerald" />
          <StatCard label="Purchases" value={purchasesCount} icon={<ShoppingBag size={20} />} color="yellow" />
          <StatCard label="Earnings" value={formatPrice(totalEarnings)} icon={<TrendingUp size={20} />} color="emerald" />
          <div className="relative group">
            <StatCard label="Wallet Balance" value={formatPrice(wallet?.balance || 0)} icon={<DollarSign size={20} />} color="cyan" />
            <button 
              onClick={() => setShowRechargeModal(true)}
              className="absolute top-2 right-2 p-1 bg-cyan-500/10 text-cyan-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold uppercase tracking-wider border border-cyan-500/20"
            >
              Recharge
            </button>
          </div>
        </div>

        {/* Profile card + quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/60 border border-white/5 rounded-xl p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-2xl font-bold text-gray-950 shadow-lg shadow-cyan-400/20">
                {profile?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{profile?.name}</p>
                <p className="text-gray-500 text-sm">{profile?.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={12} className="text-yellow-400" fill="currentColor" />
                  <span className="text-yellow-400 text-sm font-medium">{profile?.rating?.toFixed(1) || '5.0'}</span>
                  <span className="text-gray-600 text-xs ml-1">Trust Points: {profile?.trust_points ?? 100}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Trust Points', value: `${profile?.trust_points ?? 100}/100`, color: (profile?.trust_points ?? 100) >= 80 ? 'text-emerald-400' : (profile?.trust_points ?? 100) >= 50 ? 'text-yellow-400' : 'text-red-400' },
                { label: 'Role', value: profile?.role === 'admin' ? 'Admin' : 'Member', color: 'text-cyan-400' },
                { label: 'Verified', value: profile?.verified ? 'Yes' : 'No', color: profile?.verified ? 'text-emerald-400' : 'text-yellow-400' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={item.color}>{item.value}</span>
                </div>
              ))}
            </div>
            <Link to="/profile" className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 text-sm transition-all">
              Edit Profile <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gray-900/60 border border-white/5 rounded-xl p-6 col-span-1 lg:col-span-2"
          >
            <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { href: '/upload', icon: <Upload size={20} />, label: 'Sell Ticket', color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400' },
                { href: '/marketplace', icon: <ShoppingBag size={20} />, label: 'Buy Ticket', color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400' },
                { href: '/chat', icon: <MessageSquare size={20} />, label: 'Messages', color: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20 text-yellow-400' },
                { href: '/meetup', icon: <Shield size={20} />, label: 'Meetup', color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400' },
                { href: '/payment', icon: <TrendingUp size={20} />, label: 'Payments', color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400' },
                { href: '/fraud-report', icon: <AlertTriangle size={20} />, label: 'Report Fraud', color: 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400' },
              ].map((action, i) => (
                <Link
                  key={i}
                  to={action.href}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br border transition-all hover:-translate-y-1 ${action.color}`}
                >
                  {action.icon}
                  <span className="text-xs font-medium text-gray-300">{action.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* My Tickets Management - full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/60 border border-white/5 rounded-xl"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold">My Tickets</h2>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{tickets.length} total</span>
            </div>
            <div className="flex items-center gap-3">
              {activeListings > 0 && (
                <button
                  onClick={() => setSellAllConfirm(true)}
                  className="text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <DollarSign size={14} /> Sell All ({activeListings})
                </button>
              )}
              <Link to="/upload" className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-1">
                <Upload size={14} /> Add New
              </Link>
            </div>
          </div>
          {ticketsLoading ? (
            <LoadingSpinner size="sm" />
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <Ticket size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No tickets listed yet</p>
              <Link to="/upload" className="mt-3 inline-flex items-center gap-1 text-cyan-400 text-sm hover:text-cyan-300">
                List your first ticket <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {tickets.map(ticket => {
                const isSold = ticket.status === 'sold';
                return (
                  <div key={ticket.id} className={`flex items-center gap-3 p-4 hover:bg-white/2 transition-colors relative ${isSold ? 'opacity-70' : ''}`}>
                    {ticket.image_url ? (
                      <Link to={`/ticket/${ticket.id}`} className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 relative">
                        <img src={ticket.image_url} alt="" className={`w-full h-full object-cover ${isSold ? 'grayscale' : ''}`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        {isSold && (
                          <div className="absolute inset-0 bg-gray-950/60 flex items-center justify-center">
                            <span className="text-gray-300 font-black text-xs tracking-wider">SOLD</span>
                          </div>
                        )}
                      </Link>
                    ) : (
                      <Link to={`/ticket/${ticket.id}`} className="w-14 h-14 rounded-lg bg-gray-800/50 border border-white/5 flex items-center justify-center flex-shrink-0 relative">
                        <Ticket size={18} className="text-gray-600" />
                        {isSold && (
                          <div className="absolute inset-0 bg-gray-950/60 flex items-center justify-center rounded-lg">
                            <span className="text-gray-300 font-black text-xs tracking-wider">SOLD</span>
                          </div>
                        )}
                      </Link>
                    )}
                    <Link to={`/ticket/${ticket.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${isSold ? 'text-gray-500' : 'text-white'}`}>{ticket.train_name}</p>
                        {isSold && (
                          <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <CheckCircle size={10} /> SOLD
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs">{ticket.source} → {ticket.destination}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-gray-600 text-xs flex items-center gap-1">
                          <Clock size={10} /> {formatDate(ticket.journey_date)}
                        </p>
                        {!isSold && <span className="text-xs text-cyan-400">Active</span>}
                        {ticket.quantity > 1 && (
                          <span className="text-xs bg-gray-700/60 text-gray-400 px-1.5 py-0.5 rounded font-medium">
                            ×{ticket.quantity_available}/{ticket.quantity}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="text-right flex-shrink-0 mr-1">
                      <p className={`font-semibold text-sm ${isSold ? 'text-gray-300' : 'text-cyan-400'}`}>{formatPrice(ticket.price)}</p>
                      {!isSold && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          ticket.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                          ticket.status === 'expired' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>{ticket.status}</span>
                      )}
                    </div>
                    {/* Quick sell button for active tickets */}
                    {ticket.status === 'active' && (
                      <button
                        onClick={() => setConfirmAction({ type: 'sold', ticket })}
                        className="flex-shrink-0 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                      >
                        <DollarSign size={12} /> Sell
                      </button>
                    )}
                    {/* Action menu */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === ticket.id ? null : ticket.id)}
                        className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-all"
                      >
                        <MoreVertical size={16} />
                      </button>
                      <AnimatePresence>
                        {actionMenuId === ticket.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-8 w-44 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden"
                          >
                            <Link to={`/ticket/${ticket.id}`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                              <Eye size={14} /> View Details
                            </Link>
                            {ticket.status === 'active' && (
                              <button
                                onClick={() => setConfirmAction({ type: 'sold', ticket })}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left"
                              >
                                <CheckCircle size={14} /> Mark as Sold
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmAction({ type: 'delete', ticket })}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                            >
                              <Trash2 size={14} /> Delete Ticket
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Confirm action modal */}
        <AnimatePresence>
          {confirmAction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setConfirmAction(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">
                    {confirmAction.type === 'sold' ? 'Mark as Sold' : 'Delete Ticket'}
                  </h3>
                  <button onClick={() => setConfirmAction(null)} className="text-gray-500 hover:text-gray-300">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  {confirmAction.type === 'sold'
                    ? `Are you sure you want to mark "${confirmAction.ticket.train_name}" as sold? This action cannot be undone.`
                    : `Are you sure you want to delete "${confirmAction.ticket.train_name}"? This action cannot be undone.`
                  }
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 border border-white/10 text-gray-400 hover:text-gray-200 rounded-xl text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmAction.type === 'sold' ? handleMarkSold(confirmAction.ticket) : handleDelete(confirmAction.ticket)}
                    disabled={processing}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      confirmAction.type === 'sold'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-gray-950'
                        : 'bg-red-500 hover:bg-red-400 text-white'
                    } disabled:opacity-50`}
                  >
                    {processing ? (
                      <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : confirmAction.type === 'sold' ? (
                      <><CheckCircle size={14} /> Mark Sold</>
                    ) : (
                      <><Trash2 size={14} /> Delete</>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sell All confirmation modal */}
        <AnimatePresence>
          {sellAllConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setSellAllConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Sell All Active Tickets</h3>
                  <button onClick={() => setSellAllConfirm(false)} className="text-gray-500 hover:text-gray-300">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  Mark all {activeListings} active ticket{activeListings !== 1 ? 's' : ''} as sold? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSellAllConfirm(false)}
                    className="flex-1 py-2.5 border border-white/10 text-gray-400 hover:text-gray-200 rounded-xl text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSellAllActive}
                    disabled={processing}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processing ? (
                      <div className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                    ) : (
                      <><DollarSign size={14} /> Sell All</>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications + Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gray-900/60 border border-white/5 rounded-xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-white font-semibold">Recent Notifications</h2>
              <Link to="/notifications" className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map(notif => (
                  <div key={notif.id} className={`flex gap-3 p-4 ${!notif.read_status ? 'bg-cyan-500/3' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {notifIconMap[notif.type] || notifIconMap.info}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">{notif.title}</p>
                      <p className="text-gray-500 text-xs leading-relaxed">{notif.message}</p>
                      <p className="text-gray-600 text-xs mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.read_status && <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-2" />}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/60 border border-white/5 rounded-xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-white font-semibold">Recent Orders</h2>
              <Link to="/payment" className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            {ordersLoading ? (
              <LoadingSpinner size="sm" />
            ) : orders.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBag size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-gray-500 font-medium p-4">Order</th>
                      <th className="text-left text-gray-500 font-medium p-4 hidden sm:table-cell">Role</th>
                      <th className="text-left text-gray-500 font-medium p-4">Amount</th>
                      <th className="text-left text-gray-500 font-medium p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                        <td className="p-4 text-gray-300 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                        <td className="p-4 hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${order.buyer_id === user?.id ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {order.buyer_id === user?.id ? 'Buyer' : 'Seller'}
                          </span>
                        </td>
                        <td className="p-4 text-cyan-400 font-semibold">{formatPrice(order.amount)}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            order.payment_status === 'released' ? 'bg-emerald-500/10 text-emerald-400' :
                            order.payment_status === 'paid' ? 'bg-cyan-500/10 text-cyan-400' :
                            order.payment_status === 'refunded' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowRechargeModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <DollarSign size={20} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Recharge Wallet</h3>
                <p className="text-gray-500 text-xs">Add funds to buy tickets</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Amount (৳)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">৳</span>
                  <input
                    type="number"
                    value={rechargeAmount}
                    onChange={e => setRechargeAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[200, 500, 1000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(amt.toString())}
                    className="py-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-400 text-xs hover:border-cyan-500/30 hover:text-cyan-400 transition-all"
                  >
                    +৳{amt}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 py-2.5 border border-white/10 text-gray-400 hover:text-gray-200 rounded-xl text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecharge}
                  disabled={processing || !rechargeAmount || Number(rechargeAmount) <= 0}
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? (
                    <div className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                  ) : (
                    <>Confirm</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
