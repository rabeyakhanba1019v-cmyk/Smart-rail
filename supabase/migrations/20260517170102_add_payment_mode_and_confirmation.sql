/*
  # Add payment mode and confirmation fields to orders

  1. Modified Tables
    - `orders`
      - `payment_mode` (text, default 'online') - Whether payment is online or offline
      - `payment_confirmed` (boolean, default false) - Whether the receiver has confirmed payment receipt

  2. Security
    - No RLS changes needed, existing policies apply
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_mode'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_mode text DEFAULT 'online' CHECK (payment_mode IN ('online', 'offline'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_confirmed'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_confirmed boolean DEFAULT false;
  END IF;
END $$;
