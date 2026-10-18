-- Migration: 20261021_street_sweeping.sql
-- Description: Create street_sweeping_subscribers & sweeping_notification_logs tables for Move Your Car email reminders

CREATE TABLE IF NOT EXISTS public.street_sweeping_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  address TEXT NOT NULL,
  street_name TEXT NOT NULL,
  block_range TEXT,
  sweeping_day TEXT NOT NULL,
  frequency TEXT NOT NULL,
  time_window TEXT,
  sides TEXT,
  schedule_raw TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  unsubscribe_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT street_sweeping_subscribers_unique_enrollment UNIQUE(destination, address, sweeping_day)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.street_sweeping_subscribers ENABLE ROW LEVEL SECURITY;

-- Grant table privileges
GRANT ALL ON TABLE public.street_sweeping_subscribers TO service_role;
GRANT ALL ON TABLE public.street_sweeping_subscribers TO anon, authenticated;

-- Allow service_role key full CRUD access (used by serverless API endpoints)
DROP POLICY IF EXISTS "Service role full access on street_sweeping_subscribers" ON public.street_sweeping_subscribers;
CREATE POLICY "Service role full access on street_sweeping_subscribers"
  ON public.street_sweeping_subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_sweeping_subscribers_active 
  ON public.street_sweeping_subscribers(status, channel);

CREATE INDEX IF NOT EXISTS idx_sweeping_subscribers_token 
  ON public.street_sweeping_subscribers(unsubscribe_token);

-- Notification logs for street sweeping alerts to prevent duplicate emails
CREATE TABLE IF NOT EXISTS public.sweeping_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.street_sweeping_subscribers(id) ON DELETE CASCADE,
  notification_date DATE NOT NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  payload_summary TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sweeping_notification_logs ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.sweeping_notification_logs TO service_role;
GRANT ALL ON TABLE public.sweeping_notification_logs TO anon, authenticated;

DROP POLICY IF EXISTS "Service role full access on sweeping_notification_logs" ON public.sweeping_notification_logs;
CREATE POLICY "Service role full access on sweeping_notification_logs"
  ON public.sweeping_notification_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
