import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ticket } from '../types';

interface TicketFilters {
  source?: string;
  destination?: string;
  date?: string;
  seat_type?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
}

export function useTickets(filters?: TicketFilters) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters?.source) query = query.ilike('source', `%${filters.source}%`);
      if (filters?.destination) query = query.ilike('destination', `%${filters.destination}%`);
      if (filters?.date) query = query.eq('journey_date', filters.date);
      if (filters?.seat_type) query = query.eq('seat_type', filters.seat_type);
      if (filters?.min_price) query = query.gte('price', filters.min_price);
      if (filters?.max_price) query = query.lte('price', filters.max_price);

      const { data, error: err } = await query;

      if (err) {
        console.error('Error fetching tickets:', err);
        setError(err.message);
        setTickets([]);
      } else if (data) {
        // Fetch profiles for sellers
        const userIds = [...new Set(data.map((t: any) => t.user_id))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

          const profileMap = Object.fromEntries(profiles?.map((p: any) => [p.id, p]) || []);
          const ticketsWithProfiles = data.map((t: any) => ({
            ...t,
            profiles: profileMap[t.user_id],
          }));
          setTickets(ticketsWithProfiles as Ticket[]);
        } else {
          setTickets((data as Ticket[]) || []);
        }
      }
    } catch (e) {
      console.error('Exception fetching tickets:', e);
      setError('Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [JSON.stringify(filters)]);

  return { tickets, loading, error, refetch: fetchTickets };
}

export function useUserTickets(userId: string | undefined) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTickets((data as Ticket[]) || []);
        setLoading(false);
      });
  }, [userId]);

  return { tickets, loading };
}

export function usePurchasedTickets(userId: string | undefined) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from('tickets')
      .select('*')
      .eq('buyer_id', userId)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setTickets((data as Ticket[]) || []);
        setLoading(false);
      });
  }, [userId]);

  return { tickets, loading };
}
