import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Search, Image as ImageIcon, Check, CheckCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Chat, Profile } from '../types';
import { timeAgo } from '../utils/format';
import DashboardLayout from '../components/layout/DashboardLayout';

interface Conversation {
  userId: string;
  profile: Profile;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const withUserId = searchParams.get('with');
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(withUserId);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Chat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (selectedUserId && user) {
      fetchMessages(selectedUserId);
      fetchProfile(selectedUserId);

      const channel = supabase
        .channel(`chat:${user.id}:${selectedUserId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `sender_id=eq.${selectedUserId}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Chat]);
          scrollToBottom();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedUserId, user]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chats')
      .select('*, sender:profiles!chats_sender_id_fkey(*), receiver:profiles!chats_receiver_id_fkey(*)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!data) return;

    const convMap = new Map<string, Conversation>();
    for (const msg of data as (Chat & { sender: Profile; receiver: Profile })[]) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          userId: otherId,
          profile: otherProfile,
          lastMessage: msg.image_url ? '[Image]' : msg.message,
          lastTime: msg.created_at,
          unread: !msg.read_status && msg.receiver_id === user.id ? 1 : 0,
        });
      }
    }
    setConversations(Array.from(convMap.values()));
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('chats')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages((data as Chat[]) || []);
    supabase.from('chats').update({ read_status: true })
      .eq('receiver_id', user.id).eq('sender_id', otherUserId).then(() => {});
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setSelectedProfile(data as Profile);
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('error', 'Invalid file', 'Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('error', 'File too large', 'Image must be under 5MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !imageFile) || !selectedUserId || !user) return;
    setSending(true);

    let imageUrl = '';
    if (imageFile) {
      setUploading(true);
      const ext = imageFile.name.split('.').pop();
      const path = `chat-images/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('ticket-images').upload(path, imageFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('ticket-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      } else {
        toast('error', 'Image Upload Failed', uploadError.message);
        setUploading(false);
        setSending(false);
        return;
      }
      setUploading(false);
    }

    const msg = {
      sender_id: user.id,
      receiver_id: selectedUserId,
      message: newMessage.trim() || (imageUrl ? '' : ''),
      image_url: imageUrl,
      read_status: false,
    };
    const { error } = await supabase.from('chats').insert(msg);
    if (!error) {
      setMessages(prev => [...prev, { ...msg, id: Date.now().toString(), ticket_id: null, created_at: new Date().toISOString() }]);
      setNewMessage('');
      removeImage();
      fetchConversations();
    } else {
      toast('error', 'Failed to send', error.message);
    }
    setSending(false);
  };

  const filteredConversations = conversations.filter(c =>
    c.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-0 bg-gray-900/40 border border-white/5 rounded-xl overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col bg-gray-900/40">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-white font-semibold text-sm mb-3">Messages</h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..."
                className="w-full pl-8 pr-3 py-2 bg-gray-800/60 border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-all" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={24} className="text-gray-700 mx-auto mb-2" />
                <p className="text-gray-600 text-xs">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => setSelectedUserId(conv.userId)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-white/3 transition-colors border-b border-white/3 ${selectedUserId === conv.userId ? 'bg-cyan-500/10' : ''}`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-gray-950 flex-shrink-0">
                    {conv.profile?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{conv.profile?.name || 'Unknown'}</p>
                    <p className="text-gray-500 text-xs truncate">{conv.lastMessage}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-gray-600 text-xs">{timeAgo(conv.lastTime)}</p>
                    {conv.unread > 0 && (
                      <span className="w-4 h-4 bg-cyan-500 rounded-full text-xs text-gray-950 font-bold flex items-center justify-center">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        {selectedUserId && selectedProfile ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-gray-900/20">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-gray-950">
                {selectedProfile.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{selectedProfile.name}</p>
                <p className="text-emerald-400 text-xs">Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {msg.image_url && (
                          <div className={`rounded-2xl overflow-hidden ${isOwn ? 'rounded-tr-md' : 'rounded-tl-md'}`}>
                            <img
                              src={msg.image_url}
                              alt="Shared image"
                              className="max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.image_url, '_blank')}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                        )}
                        {msg.message && (
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isOwn
                              ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-tr-md'
                              : 'bg-gray-800 text-gray-200 rounded-tl-md'
                          }`}>
                            {msg.message}
                          </div>
                        )}
                        <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <p className="text-gray-600 text-xs">{timeAgo(msg.created_at)}</p>
                          {isOwn && (
                            msg.read_status ? <CheckCheck size={12} className="text-cyan-400" /> : <Check size={12} className="text-gray-600" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="px-4 pb-2">
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-white/10 object-cover" />
                  <button
                    onClick={removeImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-400 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="text-gray-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-gray-800/60 border border-white/10 focus:border-cyan-500/50 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
                />
                <button
                  onClick={sendMessage}
                  disabled={(!newMessage.trim() && !imageFile) || sending || uploading}
                  className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 rounded-xl flex items-center justify-center text-gray-950 transition-all"
                >
                  {sending || uploading ? (
                    <div className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Select a conversation</p>
              <p className="text-gray-600 text-sm mt-1">Choose a contact to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
