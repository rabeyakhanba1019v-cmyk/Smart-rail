import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    const notifs = (data as Notification[]) || [];
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read_status).length);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read_status: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from('notifications').update({ read_status: true }).eq('user_id', userId);
    setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    fetchNotifications();
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { notifications, unreadCount, loading, markAsRead, markAllRead, refetch: fetchNotifications };
}
