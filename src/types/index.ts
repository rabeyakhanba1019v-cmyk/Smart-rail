export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  verified: boolean;
  rating: number;
  trust_score: number;
  trust_points: number;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  updated_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  train_name: string;
  source: string;
  destination: string;
  journey_date: string;
  departure_time: string;
  seat_type: string;
  coach: string;
  pnr: string;
  price: number;
  original_price: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  image_url: string;
  status: 'active' | 'sold' | 'expired' | 'flagged';
  meetup_available: boolean;
  preferred_station: string;
  available_meetup_time: string;
  quantity: number;
  quantity_available: number;
  buyer_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  ticket_id: string;
  meetup_location: string;
  meetup_time: string;
  payment_status: 'pending' | 'paid' | 'released' | 'refunded';
  escrow_status: 'holding' | 'released' | 'disputed' | 'refunded';
  payment_mode: 'online' | 'offline';
  payment_confirmed: boolean;
  amount: number;
  dispute_reason: string;
  created_at: string;
  updated_at: string;
  tickets?: Ticket;
  buyer?: Profile;
  seller?: Profile;
}

export interface Chat {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  image_url: string;
  read_status: boolean;
  ticket_id: string | null;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface FraudReport {
  id: string;
  reporter_id: string;
  reported_ticket_id: string | null;
  reported_user_id: string | null;
  reason: string;
  description: string;
  evidence_image: string;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_notes: string;
  admin_id: string | null;
  admin_verdict: 'confirmed_fraud' | 'false_report' | null;
  reviewed_at: string | null;
  created_at: string;
  reporter?: Profile;
  reported_user?: Profile;
  reported_ticket?: Ticket;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'fraud' | 'payment' | 'chat';
  read_status: boolean;
  link: string;
  created_at: string;
}

export interface MeetupRequest {
  id: string;
  order_id: string | null;
  requester_id: string;
  receiver_id: string;
  buyer_station: string;
  buyer_time: string;
  seller_station: string;
  seller_time: string;
  suggested_station: string;
  suggested_time: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface PurchaseRequest {
  id: string;
  ticket_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  message: string;
  created_at: string;
  updated_at: string;
  buyer?: Profile;
  seller?: Profile;
  ticket?: Ticket;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  order_id: string | null;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: Profile;
}
