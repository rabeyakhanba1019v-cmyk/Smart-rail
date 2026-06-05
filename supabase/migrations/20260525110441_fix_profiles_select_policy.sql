/*
  # Fix RLS policy for profiles (needed for marketplace)

  1. Security Changes
    - Allow anonymous users to view profiles (limited info)
    - This enables the marketplace to show seller info without requiring login
*/

-- Allow anonymous users to view profiles (for marketplace seller info)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);