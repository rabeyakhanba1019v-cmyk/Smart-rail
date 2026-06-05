/*
  # Fix RLS policy for marketplace tickets

  1. Security Changes
    - Drop the existing SELECT policy that requires authentication
    - Create a new policy allowing anyone (including anonymous) to view tickets
    - This enables the marketplace to show tickets without requiring login
*/

-- Drop the old policy that required authentication
DROP POLICY IF EXISTS "Anyone can view active tickets" ON tickets;

-- Create new policy that allows anonymous users to view active tickets
CREATE POLICY "Anyone can view active tickets"
  ON tickets FOR SELECT
  TO anon, authenticated
  USING (true);