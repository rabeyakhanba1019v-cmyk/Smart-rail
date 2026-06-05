/*
  # Add Purchase Request System and Auto Meetup

  1. New Tables
    - `purchase_requests`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key to tickets)
      - `buyer_id` (uuid, foreign key to profiles)
      - `seller_id` (uuid, foreign key to profiles)
      - `status` (text: pending, accepted, rejected, completed)
      - `message` (text, optional message from buyer)
      - `created_at`, `updated_at` (timestamps)
  
  2. Modified Tables
    - `tickets`
      - Add `buyer_id` column to track who purchased the ticket

  3. Security
    - Enable RLS on `purchase_requests` table
    - Policies for buyers, sellers, and admins
*/

-- Add buyer_id to tickets to track who purchased
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'buyer_id'
  ) THEN
    ALTER TABLE tickets ADD COLUMN buyer_id uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Create purchase_requests table
CREATE TABLE IF NOT EXISTS purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- Policies for purchase_requests
CREATE POLICY "Buyers can view their own requests"
  ON purchase_requests FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyers can create requests"
  ON purchase_requests FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Sellers can update their ticket requests"
  ON purchase_requests FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_purchase_requests_ticket ON purchase_requests(ticket_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer ON purchase_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_seller ON purchase_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_tickets_buyer ON tickets(buyer_id);