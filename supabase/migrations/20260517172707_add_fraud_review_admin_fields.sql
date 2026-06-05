/*
  # Add admin fraud review workflow and trust points

  1. Modified Tables
    - `fraud_reports`
      - `admin_id` (uuid, nullable) - The admin who reviewed the report
      - `reviewed_at` (timestamptz, nullable) - When the report was reviewed
      - `admin_verdict` (text, nullable) - 'confirmed_fraud' or 'false_report'
    - `profiles`
      - `trust_points` (integer, default 100) - Trust points balance, deducted on false reports

  2. Security
    - Added RLS policy for admins to read all fraud reports
    - Added RLS policy for admins to update fraud reports
    - Added RLS policy for admins to update profiles (for trust point adjustments)

  3. Important Notes
    - Trust points start at 100 for all users
    - When admin confirms fraud: reported user's ticket is flagged, reporter gets no penalty
    - When admin marks as false report: reporter loses 10 trust points
    - Trust points are separate from trust_score (which is a 0-100 rating)
*/

-- Add admin review fields to fraud_reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fraud_reports' AND column_name = 'admin_id'
  ) THEN
    ALTER TABLE fraud_reports ADD COLUMN admin_id uuid REFERENCES profiles(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fraud_reports' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE fraud_reports ADD COLUMN reviewed_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fraud_reports' AND column_name = 'admin_verdict'
  ) THEN
    ALTER TABLE fraud_reports ADD COLUMN admin_verdict text CHECK (admin_verdict IN ('confirmed_fraud', 'false_report'));
  END IF;
END $$;

-- Add trust_points to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trust_points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trust_points integer NOT NULL DEFAULT 100;
  END IF;
END $$;

-- Admin can read all fraud reports
CREATE POLICY "Admins can read all fraud reports"
  ON fraud_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin can update fraud reports
CREATE POLICY "Admins can update fraud reports"
  ON fraud_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin can update profiles (for trust point adjustments)
CREATE POLICY "Admins can update profiles for trust adjustments"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin can update ticket status (for flagging fraudulent tickets)
CREATE POLICY "Admins can update any ticket"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_fraud_reports_status ON fraud_reports(status);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_reported_user ON fraud_reports(reported_user_id);
