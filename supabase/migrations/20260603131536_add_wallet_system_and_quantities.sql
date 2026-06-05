/*
  # Add Wallet System and Ticket Quantities

  1. New Tables
    - `wallets` - stores user wallet balances
      - `user_id` (uuid, primary key, references profiles)
      - `balance` (numeric, default 0)
      - `total_earned` (numeric, total earnings from sales)
      - `total_spent` (numeric, total spent on purchases)
      - `updated_at` (timestamp)

  2. Modified Tables
    - `tickets`
      - Add `quantity` column (default 1)
      - Add `quantity_available` column to track remaining quantity

  3. Security
    - Enable RLS on wallets
    - Policies for users to view/update their own wallet
*/

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  total_earned numeric NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Add quantity columns to tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE tickets ADD COLUMN quantity integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'quantity_available'
  ) THEN
    ALTER TABLE tickets ADD COLUMN quantity_available integer DEFAULT 1;
  END IF;
END $$;

-- Enable RLS on wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Wallet policies
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);