-- Migration: 20261021_waste_searches.sql
-- Description: Track bin sorter queries to discover common patterns and identify what items residents find most confusing

CREATE TABLE IF NOT EXISTS public.waste_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  item_title TEXT,
  destination TEXT,
  source TEXT DEFAULT 'rules',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.waste_searches ENABLE ROW LEVEL SECURITY;

-- Grant table privileges
GRANT ALL ON TABLE public.waste_searches TO service_role;
GRANT ALL ON TABLE public.waste_searches TO anon, authenticated;

-- Allow service_role key full CRUD access (used by serverless API endpoints)
DROP POLICY IF EXISTS "Service role full access on waste_searches" ON public.waste_searches;
CREATE POLICY "Service role full access on waste_searches"
  ON public.waste_searches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for fast pattern analysis, aggregation, and queries
CREATE INDEX IF NOT EXISTS idx_waste_searches_normalized_query 
  ON public.waste_searches(normalized_query);

CREATE INDEX IF NOT EXISTS idx_waste_searches_created_at 
  ON public.waste_searches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_waste_searches_destination 
  ON public.waste_searches(destination);
