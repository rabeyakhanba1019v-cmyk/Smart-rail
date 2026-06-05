-- Fix chat INSERT RLS: explicitly guard on authenticated role so a stale/null
-- auth.uid() doesn't silently pass the check and fail with a misleading error.

DROP POLICY IF EXISTS "Users can send messages" ON chats;

CREATE POLICY "Users can send messages"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() IS NOT NULL
    AND auth.uid() = sender_id
  );
