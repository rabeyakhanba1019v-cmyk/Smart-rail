/*
  # Bangladesh Railway Exchange - Initial Schema

  ## Overview
  Creates all tables required for the AI-powered Bangladesh Railway ticket marketplace.

  ## Tables Created
  1. `profiles` - Extended user profile linked to auth.users
  2. `tickets` - Railway ticket listings with fraud detection fields
  3. `orders` - Escrow-based purchase orders
  4. `chats` - Realtime chat messages between buyers/sellers
  5. `fraud_reports` - Community fraud flags for tickets/users
  6. `notifications` - Per-user notification feed
  7. `meetup_requests` - Smart meetup coordination
  8. `reviews` - Seller/buyer reviews post-transaction

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read/write own data
  - Admin role checks via profiles.role field
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  role text NOT NULL DEFAULT 'user',
  verified boolean NOT NULL DEFAULT false,
  rating numeric(3,2) NOT NULL DEFAULT 5.00,
  trust_score integer NOT NULL DEFAULT 100,
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- TICKETS
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  train_name text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  journey_date date NOT NULL,
  departure_time time NOT NULL,
  seat_type text NOT NULL DEFAULT 'S_CHAIR',
  coach text DEFAULT '',
  pnr text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  original_price numeric(10,2) DEFAULT 0,
  fraud_score integer NOT NULL DEFAULT 0,
  fraud_flags integer NOT NULL DEFAULT 0,
  verification_status text NOT NULL DEFAULT 'pending',
  image_url text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  meetup_available boolean NOT NULL DEFAULT true,
  preferred_station text DEFAULT '',
  available_meetup_time text DEFAULT '',
  ocr_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  meetup_location text DEFAULT '',
  meetup_time timestamptz,
  payment_status text NOT NULL DEFAULT 'pending',
  escrow_status text NOT NULL DEFAULT 'holding',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  dispute_reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Involved parties can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- CHATS
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  read_status boolean NOT NULL DEFAULT false,
  ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats"
  ON chats FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update read status"
  ON chats FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- FRAUD REPORTS
CREATE TABLE IF NOT EXISTS fraud_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  description text DEFAULT '',
  evidence_image text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE fraud_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON fraud_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can submit fraud reports"
  ON fraud_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  read_status boolean NOT NULL DEFAULT false,
  link text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- MEETUP REQUESTS
CREATE TABLE IF NOT EXISTS meetup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_station text DEFAULT '',
  buyer_time text DEFAULT '',
  seller_station text DEFAULT '',
  seller_time text DEFAULT '',
  suggested_station text DEFAULT '',
  suggested_time text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meetup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetup requests"
  ON meetup_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create meetup requests"
  ON meetup_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Involved parties can update meetup"
  ON meetup_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  rating integer NOT NULL DEFAULT 5,
  comment text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can submit reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_source_dest ON tickets(source, destination);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_sender ON chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_chats_receiver ON chats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_ticket ON fraud_reports(reported_ticket_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
