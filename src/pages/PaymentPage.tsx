import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Shield, CheckCircle, Clock, AlertTriangle, ArrowRight, TrendingUp, FileText, Eye, EyeOff, Wallet, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Order } from '../types';
import { formatPrice, formatDate } from '../utils/format';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function PaymentPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, tickets(*), buyer:profiles!orders_buyer_id_fkey(*), seller:profiles!orders_seller_id_fkey(*)')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) || []);
        setLoading(false);
      });
  }, [user]);

  const updateOrderStatus = async (orderId: string, updates: Partial<Order>) => {
    const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
      toast('success', 'Order Updated', 'Payment status has been updated.');
    } else {
      toast('error', 'Update Failed', error.message);
    }
  };

  const filtered = activeTab === 'all' ? orders :
    activeTab === 'pending' ? orders.filter(o => o.payment_status === 'pending' || o.payment_status === 'paid') :
    orders.filter(o => o.payment_status === 'released' || o.payment_status === 'refunded');

  const totalEscrow = orders.filter(o => o.escrow_status === 'holding').reduce((s, o) => s + o.amount, 0);
  const totalReleased = orders.filter(o => o.payment_status === 'released' && o.seller_id === user?.id).reduce((s, o) => s + o.amount, 0);

  const statusConfig = {
    pending: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: <Clock size={12} /> },
    paid: { label: 'Paid / In Escrow', color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: <Shield size={12} /> },
    released: { label: 'Released', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <CheckCircle size={12} /> },
    refunded: { label: 'Refunded', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: <AlertTriangle size={12} /> },
  };

  const canShowTicket = (order: Order): boolean => {
    const isBuyer = order.buyer_id === user?.id;
    if (order.payment_mode === 'offline') {
      return isBuyer && order.payment_confirmed && order.payment_status === 'paid';
    }
    return isBuyer && order.payment_confirmed && (order.payment_status === 'paid' || order.payment_status === 'released');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Payments & Escrow</h1>
          <p className="text-gray-500 text-sm mt-1">Track all your transactions and escrow status</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-cyan-400" />
              <p className="text-gray-400 text-sm">In Escrow</p>
            </div>
            <p className="text-2xl font-bold text-white">{formatPrice(totalEscrow)}</p>
            <p className="text-gray-500 text-xs mt-1">Securely held funds</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-emerald-400" />
              <p className="text-gray-400 text-sm">Total Earnings</p>
            </div>
            <p className="text-2xl font-bold text-white">{formatPrice(totalReleased)}</p>
            <p className="text-gray-500 text-xs mt-1">Released to you</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={18} className="text-yellow-400" />
              <p className="text-gray-400 text-sm">Total Orders</p>
            </div>
            <p className="text-2xl font-bold text-white">{orders.length}</p>
            <p className="text-gray-500 text-xs mt-1">All time transactions</p>
          </div>
        </div>

        {/* Escrow flow */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
          <p className="text-white font-semibold text-sm mb-4">How Escrow Works</p>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { step: 'Buyer Pays', icon: <CreditCard size={14} />, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
              { step: 'Funds Held', icon: <Shield size={14} />, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
              { step: 'Receiver Confirms', icon: <CheckCircle size={14} />, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
              { step: 'Ticket Revealed', icon: <FileText size={14} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
              { step: 'Seller Paid', icon: <TrendingUp size={14} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${step.color}`}>
                  {step.icon} {step.step}
                </div>
                {i < 4 && <ArrowRight size={12} className="text-gray-600 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Orders list */}
        <div className="bg-gray-900/60 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <h2 className="text-white font-semibold">Order History</h2>
            <div className="flex gap-1">
              {(['all', 'pending', 'completed'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-xs rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="sm" />
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(order => {
                const isBuyer = order.buyer_id === user?.id;
                const cfg = statusConfig[order.payment_status as keyof typeof statusConfig] || statusConfig.pending;
                const showTicket = canShowTicket(order);
                const isExpanded = selectedOrder === order.id;

                return (
                  <div key={order.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} flex items-center gap-1`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isBuyer ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {isBuyer ? 'Buyer' : 'Seller'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            order.payment_mode === 'online' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {order.payment_mode === 'online' ? <><Smartphone size={10} /> Online</> : <><Wallet size={10} /> Offline</>}
                          </span>
                          {order.payment_confirmed && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                              <CheckCircle size={10} /> Confirmed
                            </span>
                          )}
                        </div>
                        {order.tickets && (
                          <p className="text-white font-medium text-sm">
                            {order.tickets.train_name} — {order.tickets.source} → {order.tickets.destination}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs mt-0.5">Order #{order.id.slice(0, 8)} · {formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-cyan-400 font-bold text-lg">{formatPrice(order.amount)}</p>
                        <div className="flex gap-2 mt-2 justify-end flex-wrap">
                          {/* Buyer: Choose payment mode when pending */}
                          {order.payment_status === 'pending' && isBuyer && (
                            <>
                              <button onClick={() => updateOrderStatus(order.id, { payment_mode: 'online', payment_status: 'paid' })}
                                className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs rounded-lg transition-all flex items-center gap-1">
                                <Smartphone size={10} /> Pay Online
                              </button>
                              <button onClick={() => updateOrderStatus(order.id, { payment_mode: 'offline', payment_status: 'paid' })}
                                className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs rounded-lg transition-all flex items-center gap-1">
                                <Wallet size={10} /> Pay Offline
                              </button>
                            </>
                          )}

                          {/* Seller/Receiver: Confirm payment received */}
                          {order.payment_status === 'paid' && !order.payment_confirmed && !isBuyer && (
                            <button onClick={() => updateOrderStatus(order.id, { payment_confirmed: true })}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs rounded-lg transition-all flex items-center gap-1">
                              <CheckCircle size={10} /> Confirm Payment Received
                            </button>
                          )}

                          {/* Seller: Release funds after confirmation */}
                          {order.payment_status === 'paid' && order.payment_confirmed && !isBuyer && (
                            <button onClick={() => updateOrderStatus(order.id, { payment_status: 'released', escrow_status: 'released' })}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs rounded-lg transition-all flex items-center gap-1">
                              Release Funds
                            </button>
                          )}

                          {/* Buyer: View ticket when available */}
                          {isBuyer && order.payment_status === 'paid' && (
                            <button onClick={() => setSelectedOrder(isExpanded ? null : order.id)}
                              className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1 ${
                                showTicket ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400' : 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                              }`} disabled={!showTicket}>
                              {showTicket ? <><Eye size={10} /> View Ticket</> : <><EyeOff size={10} /> Ticket Locked</>}
                            </button>
                          )}

                          {/* Buyer: Request refund */}
                          {(order.payment_status === 'pending' || order.payment_status === 'paid') && isBuyer && (
                            <button onClick={() => updateOrderStatus(order.id, { payment_status: 'refunded', escrow_status: 'refunded' })}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-all">
                              Refund
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ticket PDF / Details section - only shown when buyer can see it */}
                    {isExpanded && isBuyer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 overflow-hidden"
                      >
                        {showTicket ? (
                          <div className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 border border-cyan-500/20 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <FileText size={16} className="text-cyan-400" />
                              <p className="text-white font-semibold text-sm">Ticket Details</p>
                              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Payment Confirmed</span>
                            </div>
                            {order.tickets && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                                  <div>
                                    <p className="text-white font-bold">{order.tickets.train_name}</p>
                                    <p className="text-gray-400 text-sm">{order.tickets.source} → {order.tickets.destination}</p>
                                  </div>
                                  <p className="text-cyan-400 font-bold text-lg">{formatPrice(order.tickets.price)}</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                  <div className="bg-gray-900/50 rounded-lg p-2.5">
                                    <p className="text-gray-500">Date</p>
                                    <p className="text-white font-medium">{formatDate(order.tickets.journey_date)}</p>
                                  </div>
                                  <div className="bg-gray-900/50 rounded-lg p-2.5">
                                    <p className="text-gray-500">Time</p>
                                    <p className="text-white font-medium">{order.tickets.departure_time}</p>
                                  </div>
                                  <div className="bg-gray-900/50 rounded-lg p-2.5">
                                    <p className="text-gray-500">Seat / Coach</p>
                                    <p className="text-white font-medium">{order.tickets.seat_type} / {order.tickets.coach || 'N/A'}</p>
                                  </div>
                                  <div className="bg-gray-900/50 rounded-lg p-2.5">
                                    <p className="text-gray-500">PNR</p>
                                    <p className="text-white font-medium font-mono">{order.tickets.pnr || 'N/A'}</p>
                                  </div>
                                </div>
                                {order.tickets.image_url && (
                                  <div className="mt-2">
                                    <img src={order.tickets.image_url} alt="Ticket" className="max-h-48 object-contain rounded-lg mx-auto" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-800/30 border border-white/5 rounded-xl p-5 text-center">
                            <EyeOff size={24} className="text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm font-medium">Ticket details are locked</p>
                            <p className="text-gray-600 text-xs mt-1">
                              {order.payment_mode === 'offline'
                                ? 'The seller must confirm they received your payment before the ticket is revealed.'
                                : 'Waiting for payment confirmation from the seller before revealing ticket details.'}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Offline payment notice */}
                    {order.payment_mode === 'offline' && order.payment_status === 'paid' && !order.payment_confirmed && isBuyer && (
                      <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
                        <Wallet size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-yellow-400 text-xs font-semibold">Offline Payment Pending Confirmation</p>
                          <p className="text-gray-400 text-xs mt-0.5">You selected offline payment. The ticket details will be revealed once the seller confirms they have received the money.</p>
                        </div>
                      </div>
                    )}

                    {/* Online payment notice */}
                    {order.payment_mode === 'online' && order.payment_status === 'paid' && !order.payment_confirmed && isBuyer && (
                      <div className="mt-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 flex items-start gap-2">
                        <Smartphone size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-cyan-400 text-xs font-semibold">Online Payment Processing</p>
                          <p className="text-gray-400 text-xs mt-0.5">Your payment is being processed. Ticket details will be revealed once the seller confirms receipt.</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
