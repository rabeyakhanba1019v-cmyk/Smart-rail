import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain as Train, ArrowLeft, MapPin, Star, MessageSquare, Flag, CheckCircle, CreditCard, Share2, Trash2, User, Users, Clock, AlertCircle, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ticket, Profile, PurchaseRequest, Wallet as WalletType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useWallet, deductWalletBalance, addWalletBalance } from '../hooks/useWallet';
import { formatPrice, formatDate, SEAT_TYPES } from '../utils/format';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [myRequest, setMyRequest] = useState<PurchaseRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<'sold' | 'delete' | null>(null);
  const [processing, setProcessing] = useState(false);
  const { user, profile } = useAuth();
  const { wallet, loading: walletLoading } = useWallet(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    loadTicketAndRequests();
  }, [id, user]);

  const loadTicketAndRequests = async () => {
    const { data: ticketData } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (ticketData) {
      // Fetch seller profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ticketData.user_id)
        .maybeSingle();

      const ticketWithProfile = {
        ...ticketData,
        profiles: profileData,
      };
      setTicket(ticketWithProfile as Ticket);
    } else {
      setTicket(ticketData as Ticket);
    }
    setLoading(false);

    if (ticketData && user) {
      // Load purchase requests for this ticket
      const { data: requests } = await supabase
        .from('purchase_requests')
        .select('*, buyer:profiles!purchase_requests_buyer_id_fkey(*), seller:profiles!purchase_requests_seller_id_fkey(*)')
        .eq('ticket_id', id)
        .order('created_at', { ascending: false });

      if (requests) {
        setPurchaseRequests(requests as PurchaseRequest[]);
        // Check if current user already has a request
        const existing = requests.find((r: any) => r.buyer_id === user.id);
        if (existing) setMyRequest(existing as PurchaseRequest);
      }
    }
  };

  // Buyer requests to purchase
  const handlePurchaseRequest = async () => {
    if (!user) { navigate('/login'); return; }
    if (!ticket) return;
    if (ticket.user_id === user.id) { toast('error', 'Cannot Request', 'You cannot buy your own ticket.'); return; }
    if (myRequest) { toast('error', 'Already Requested', 'You have already requested this ticket.'); return; }

    // Check wallet balance
    if (!wallet || wallet.balance < ticket.price) {
      toast('error', 'Insufficient Funds', 'You have no earnings to pay.');
      return;
    }

    setRequesting(true);
    const { error } = await supabase.from('purchase_requests').insert({
      ticket_id: ticket.id,
      buyer_id: user.id,
      seller_id: ticket.user_id,
      message: requestMessage,
      status: 'pending',
    });

    if (error) {
      toast('error', 'Request Failed', error.message);
    } else {
      await supabase.from('notifications').insert({
        user_id: ticket.user_id,
        title: 'New Purchase Request',
        message: `${profile?.name || 'A user'} wants to purchase your ${ticket.train_name} ticket.`,
        type: 'payment',
        link: `/ticket/${ticket.id}`,
      });
      toast('success', 'Request Sent!', 'The seller will review your request.');
      setShowRequestForm(false);
      setRequestMessage('');
      loadTicketAndRequests();
    }
    setRequesting(false);
  };

  // Seller accepts a buyer's request and processes payment
  const handleAcceptRequest = async (request: PurchaseRequest) => {
    if (!ticket) return;
    setProcessing(true);

    try {
      // Use RPC for atomic transaction: Check balance, transfer funds, update ticket, and notify
      const { data, error: rpcError } = await supabase.rpc('process_ticket_purchase', {
        p_request_id: request.id,
        p_ticket_id: ticket.id,
        p_buyer_id: request.buyer_id,
        p_seller_id: ticket.user_id,
        p_amount: ticket.price
      });

      if (rpcError) {
        if (rpcError.message.includes('Insufficient balance')) {
          toast('error', 'Insufficient Funds', 'The buyer has no earnings to pay.');
        } else {
          toast('error', 'Transaction Failed', rpcError.message);
        }
        setProcessing(false);
        return;
      }

      // Success! 
      toast('success', 'Request Accepted & Payment Processed', `Sale completed with ${request.buyer?.name || 'the buyer'}. Payment: ${formatPrice(ticket.price)}`);
      
      // Add a manual notification for the buyer (since RPCs don't trigger app notifications automatically usually)
      await supabase.from('notifications').insert({
        user_id: request.buyer_id,
        title: 'Request Accepted & Payment Processed!',
        message: `Your request for ${ticket.train_name} has been accepted. Payment of ${formatPrice(ticket.price)} has been deducted from your wallet.`,
        type: 'success',
        link: `/ticket/${ticket.id}`,
      });

      setTicket({ ...ticket, status: 'sold', buyer_id: request.buyer_id });
      loadTicketAndRequests();
    } catch (e) {
      toast('error', 'Error', 'An error occurred while processing the payment.');
    } finally {
      setProcessing(false);
    }
  };

  // Seller rejects a buyer's request
  const handleRejectRequest = async (request: PurchaseRequest) => {
    setProcessing(true);
    const { error } = await supabase
      .from('purchase_requests')
      .update({ status: 'rejected' })
      .eq('id', request.id);

    if (error) {
      toast('error', 'Failed', error.message);
    } else {
      toast('info', 'Request Rejected', 'The buyer has been notified.');
      loadTicketAndRequests();
    }
    setProcessing(false);
  };

  const handleFlag = async () => {
    if (!user) { navigate('/login'); return; }
    navigate(`/fraud-report?ticket=${id}`);
  };

  const handleMarkSold = async () => {
    if (!ticket) return;
    setProcessing(true);
    const { error } = await supabase.from('tickets').update({ status: 'sold' }).eq('id', ticket.id);
    if (error) {
      toast('error', 'Update Failed', error.message);
    } else {
      setTicket({ ...ticket, status: 'sold' });
      toast('success', 'Ticket Marked as Sold', `${ticket.train_name} is now marked as sold.`);
    }
    setProcessing(false);
    setConfirmAction(null);
  };

  const handleDelete = async () => {
    if (!ticket) return;
    setProcessing(true);
    const { error } = await supabase.from('tickets').delete().eq('id', ticket.id);
    if (error) {
      toast('error', 'Delete Failed', error.message);
    } else {
      toast('success', 'Ticket Deleted', 'Your listing has been removed.');
      navigate('/dashboard');
    }
    setProcessing(false);
    setConfirmAction(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <LoadingSpinner fullScreen />
    </div>
  );

  if (!ticket) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="pt-20 text-center py-20">
        <p className="text-gray-400">Ticket not found.</p>
        <Link to="/marketplace" className="text-cyan-400 mt-4 inline-block">Back to Marketplace</Link>
      </div>
    </div>
  );

  const seatLabel = SEAT_TYPES.find(s => s.value === ticket.seat_type)?.label || ticket.seat_type;
  const isSold = ticket.status === 'sold';
  const isOwner = user?.id === ticket.user_id;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="pt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-gray-900/60 border rounded-2xl overflow-hidden ${isSold ? 'border-gray-500/20' : 'border-white/5'}`}>
              <div className={`h-1.5 ${isSold ? 'bg-gray-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-500'}`} />
              {isSold && (
                <div className="bg-gray-800/80 border-b border-gray-500/20 px-6 py-3 flex items-center gap-3">
                  <CheckCircle size={20} className="text-gray-400" />
                  <div>
                    <p className="text-gray-300 font-bold text-sm">This ticket has been sold</p>
                    <p className="text-gray-500 text-xs">The listing is no longer available for purchase</p>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Train size={20} className="text-cyan-400" />
                      <h1 className="text-2xl font-bold text-white">{ticket.train_name}</h1>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-cyan-400">{formatPrice(ticket.price)}</p>
                    {ticket.original_price > 0 && ticket.original_price !== ticket.price && (
                      <p className="text-gray-500 text-sm line-through">{formatPrice(ticket.original_price)}</p>
                    )}
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center justify-between mb-6 bg-gray-800/50 rounded-xl p-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">From</p>
                    <p className="text-white font-bold text-lg">{ticket.source}</p>
                    <p className="text-cyan-400 text-sm font-medium">{ticket.departure_time}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-px w-20 bg-gradient-to-r from-cyan-500/30 to-emerald-500/30" />
                    <Train size={16} className="text-gray-600" />
                    <div className="h-px w-20 bg-gradient-to-r from-cyan-500/30 to-emerald-500/30" />
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">To</p>
                    <p className="text-white font-bold text-lg">{ticket.destination}</p>
                    <p className="text-gray-400 text-sm">{formatDate(ticket.journey_date)}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Seat Class', value: seatLabel },
                    { label: 'Coach', value: ticket.coach || 'N/A' },
                    { label: 'PNR', value: ticket.pnr || 'N/A' },
                    { label: 'Date', value: formatDate(ticket.journey_date) },
                    { label: 'Quantity', value: `${ticket.quantity_available ?? ticket.quantity ?? 1} / ${ticket.quantity ?? 1}` },
                  ].map((detail, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <p className="text-gray-500 text-xs mb-1">{detail.label}</p>
                      <p className="text-white text-sm font-semibold">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Ticket image */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-gray-900/60 border border-white/5 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <p className="text-white font-medium text-sm">Ticket Image</p>
                {ticket.image_url && (
                  <a href={ticket.image_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors">
                    View Full Size
                  </a>
                )}
              </div>
              {ticket.image_url ? (
                <div className="p-4 bg-gray-800/30">
                  <img
                    src={ticket.image_url}
                    alt="Ticket"
                    className="w-full max-h-80 object-contain rounded-lg mx-auto"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-xl bg-gray-800/50 flex items-center justify-center mx-auto mb-3">
                    <Train size={24} className="text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm">No ticket image provided</p>
                  <p className="text-gray-600 text-xs mt-1">The seller did not upload an image for this listing</p>
                </div>
              )}
            </motion.div>

            {/* Meetup info */}
            {ticket.meetup_available && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-emerald-400" />
                  <p className="text-white font-semibold">Meetup Available</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Preferred Station</p>
                    <p className="text-gray-200 font-medium">{ticket.preferred_station || 'Flexible'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Available Time</p>
                    <p className="text-gray-200 font-medium">{ticket.available_meetup_time || 'Flexible'}</p>
                  </div>
                </div>
                <Link to="/meetup" className="mt-3 inline-flex items-center gap-1 text-emerald-400 text-xs hover:text-emerald-300 transition-colors">
                  Use Smart Meetup Engine →
                </Link>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Seller info */}
            {ticket.profiles && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
                <p className="text-white font-semibold text-sm mb-4">Seller Profile</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-lg font-bold text-gray-950">
                    {ticket.profiles.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{ticket.profiles.name}</p>
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      <Star size={12} fill="currentColor" /> {ticket.profiles.rating?.toFixed(1) || '5.0'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trust Points</span>
                    <span className={`font-medium ${(ticket.profiles.trust_points ?? 100) >= 80 ? 'text-emerald-400' : (ticket.profiles.trust_points ?? 100) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {ticket.profiles.trust_points ?? 100}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Verified</span>
                    <span className={ticket.profiles.verified ? 'text-emerald-400' : 'text-yellow-400'}>
                      {ticket.profiles.verified ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
              {isOwner ? (
                <>
                  {isSold ? (
                    <div className="p-4 bg-gray-800/50 border border-gray-500/20 rounded-xl text-center">
                      <CheckCircle size={24} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-300 font-semibold text-sm">This ticket is sold</p>
                      <p className="text-gray-500 text-xs mt-1">The listing is no longer available</p>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setConfirmAction('sold')}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} /> Mark as Sold
                      </button>
                      <button
                        onClick={() => setConfirmAction('delete')}
                        className="w-full py-3 flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-all"
                      >
                        <Trash2 size={16} /> Delete Listing
                      </button>
                    </>
                  )}
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-center text-cyan-400 text-xs">
                    This is your listing
                  </div>
                </>
              ) : (
                <>
                  {/* If user is the buyer of this sold ticket */}
                  {isSold && ticket.buyer_id === user?.id ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={20} className="text-emerald-400" />
                        <p className="text-emerald-400 font-bold">You Own This Ticket</p>
                      </div>
                      <p className="text-gray-400 text-sm">The seller has accepted your request. This ticket is now yours.</p>
                    </div>
                  ) : isSold ? (
                    <div className="p-4 bg-gray-800/50 border border-gray-500/20 rounded-xl text-center">
                      <CheckCircle size={24} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-300 font-semibold text-sm">This ticket has been sold</p>
                      <p className="text-gray-500 text-xs mt-1">No longer available for purchase</p>
                    </div>
                  ) : myRequest ? (
                    <div className={`p-4 rounded-xl ${
                      myRequest.status === 'accepted' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                      myRequest.status === 'rejected' ? 'bg-red-500/10 border border-red-500/30' :
                      'bg-yellow-500/10 border border-yellow-500/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {myRequest.status === 'accepted' ? <CheckCircle size={18} className="text-emerald-400" /> :
                         myRequest.status === 'rejected' ? <Flag size={18} className="text-red-400" /> :
                         <Clock size={18} className="text-yellow-400" />}
                        <p className={`font-semibold ${
                          myRequest.status === 'accepted' ? 'text-emerald-400' :
                          myRequest.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {myRequest.status === 'accepted' ? 'Request Accepted!' :
                           myRequest.status === 'rejected' ? 'Request Rejected' : 'Request Pending'}
                        </p>
                      </div>
                      <p className="text-gray-400 text-xs">
                        {myRequest.status === 'accepted' ? 'The seller will complete the sale with you.' :
                         myRequest.status === 'rejected' ? 'The seller declined your request.' :
                         'Waiting for seller to review your request...'}
                      </p>
                    </div>
                  ) : !showRequestForm ? (
                    <>
                      {!walletLoading && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 ${
                          wallet && wallet.balance >= ticket.price
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'bg-red-500/10 border border-red-500/30'
                        }`}>
                          <Wallet size={20} className={wallet && wallet.balance >= ticket.price ? 'text-emerald-400' : 'text-red-400'} />
                          <div>
                            <p className={`text-xs ${wallet && wallet.balance >= ticket.price ? 'text-emerald-400' : 'text-red-400'}`}>
                              Wallet Balance
                            </p>
                            <p className={`font-bold ${wallet && wallet.balance >= ticket.price ? 'text-emerald-300' : 'text-red-300'}`}>
                              {formatPrice(wallet?.balance || 0)}
                            </p>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => setShowRequestForm(true)}
                        disabled={isSold || !wallet || wallet.balance < ticket.price}
                        className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                      >
                        {!wallet || wallet.balance < ticket.price ? (
                          <><AlertCircle size={18} /> Insufficient Balance</>
                        ) : (
                          <><CreditCard size={18} /> Request to Buy - {formatPrice(ticket.price)}</>
                        )}
                      </button>
                      {wallet && wallet.balance < ticket.price && !isSold && (
                        <Link 
                          to="/dashboard" 
                          className="block text-center text-xs text-cyan-400 hover:text-cyan-300 font-medium mt-2"
                        >
                          Need more funds? Recharge in Dashboard →
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-400 text-xs text-center">Send a request to the seller</p>
                      <textarea
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder="Optional: Leave a message for the seller..."
                        rows={3}
                        className="w-full px-3 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all resize-none"
                      />
                      <button
                        onClick={handlePurchaseRequest}
                        disabled={requesting}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 text-gray-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {requesting ? <div className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" /> : <><CheckCircle size={16} /> Send Request</>}
                      </button>
                      <button
                        onClick={() => { setShowRequestForm(false); setRequestMessage(''); }}
                        className="w-full py-2 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {!isSold && (
                    <Link
                      to={`/chat?with=${ticket.user_id}&ticket=${ticket.id}`}
                      className="w-full py-3 flex items-center justify-center gap-2 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:bg-cyan-500/10 rounded-xl text-sm font-medium transition-all"
                    >
                      <MessageSquare size={16} /> Message Seller
                    </Link>
                  )}
                  <button
                    onClick={handleFlag}
                    className="w-full py-2.5 flex items-center justify-center gap-2 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:bg-red-500/5 rounded-xl text-xs font-medium transition-all"
                  >
                    <Flag size={12} /> Report Suspicious
                  </button>
                </>
              )}
              <button className="w-full py-2.5 flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-gray-200 rounded-xl text-xs transition-all">
                <Share2 size={12} /> Share Ticket
              </button>
            </motion.div>

            {/* Purchase Requests for Seller */}
            {isOwner && purchaseRequests.length > 0 && !isSold && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
                <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <Users size={16} className="text-cyan-400" /> Purchase Requests ({purchaseRequests.length})
                </p>
                <div className="space-y-3">
                  {purchaseRequests.map((req) => (
                    <div key={req.id} className={`p-3 rounded-lg ${req.status === 'pending' ? 'bg-gray-800/50' : 'bg-gray-800/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-gray-950">
                            {req.buyer?.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{req.buyer?.name || 'Unknown'}</p>
                            <p className="text-gray-500 text-xs flex items-center gap-1">
                              <Star size={8} className="text-yellow-400" /> {req.buyer?.rating?.toFixed(1) || '5.0'} | Trust Points: {req.buyer?.trust_points ?? 100}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          req.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      {req.message && (
                        <p className="text-gray-400 text-xs mb-2 italic">"{req.message}"</p>
                      )}
                      {req.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleAcceptRequest(req)}
                            disabled={processing}
                            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 text-xs font-bold rounded-lg transition-all"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req)}
                            disabled={processing}
                            className="flex-1 py-2 border border-red-500/30 hover:border-red-500/50 text-red-400 text-xs font-medium rounded-lg transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      {/* Confirm action modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full"
          >
            <h3 className="text-white font-bold text-lg mb-2">
              {confirmAction === 'sold' ? 'Mark as Sold' : 'Delete Ticket'}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {confirmAction === 'sold'
                ? `Mark "${ticket?.train_name}" as sold? This cannot be undone.`
                : `Delete "${ticket?.train_name}"? This cannot be undone.`
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
                onClick={confirmAction === 'sold' ? handleMarkSold : handleDelete}
                disabled={processing}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  confirmAction === 'sold'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-gray-950'
                    : 'bg-red-500 hover:bg-red-400 text-white'
                } disabled:opacity-50`}
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : confirmAction === 'sold' ? (
                  <><CheckCircle size={14} /> Mark Sold</>
                ) : (
                  <><Trash2 size={14} /> Delete</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
