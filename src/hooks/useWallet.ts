import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet } from '../types';

export function useWallet(userId: string | undefined) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchWallet = async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setWallet(data as Wallet);
      } else if (!error) {
        // Create wallet if it doesn't exist
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: 0 })
          .select()
          .maybeSingle();

        if (newWallet) setWallet(newWallet as Wallet);
      }
      setLoading(false);
    };

    fetchWallet();
  }, [userId]);

  return { wallet, loading };
}

export async function deductWalletBalance(userId: string, amount: number) {
  const { data: current, error: fetchError } = await supabase
    .from('wallets').select('balance, total_spent').eq('user_id', userId).single();
  if (fetchError || !current) return { data: null, error: fetchError };
  if (current.balance < amount) return { data: null, error: new Error('Insufficient balance') };

  const { data, error } = await supabase
    .from('wallets')
    .update({
      balance: current.balance - amount,
      total_spent: current.total_spent + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  return { data, error };
}

export async function addWalletBalance(userId: string, amount: number) {
  const { data: current, error: fetchError } = await supabase
    .from('wallets').select('balance, total_earned').eq('user_id', userId).single();
  if (fetchError || !current) return { data: null, error: fetchError };

  const { data, error } = await supabase
    .from('wallets')
    .update({
      balance: current.balance + amount,
      total_earned: current.total_earned + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  return { data, error };
}

export async function rechargeWallet(userId: string, amount: number) {
  const { data: current, error: fetchError } = await supabase
    .from('wallets').select('balance').eq('user_id', userId).single();
  if (fetchError || !current) return { data: null, error: fetchError };

  const { data, error } = await supabase
    .from('wallets')
    .update({
      balance: current.balance + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  return { data, error };
}

