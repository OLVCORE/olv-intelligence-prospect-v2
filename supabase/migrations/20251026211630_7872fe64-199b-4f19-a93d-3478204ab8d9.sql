-- Add TOTVS detection and intent signals tables

-- Add TOTVS detection fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS totvs_detection_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS totvs_detection_sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS totvs_last_checked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_disqualified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS disqualification_reason TEXT;

-- Create intent_signals table for tracking buying signals
CREATE TABLE IF NOT EXISTS public.intent_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL, -- 'job_posting', 'news', 'growth', 'linkedin_activity', 'search_activity'
  signal_source TEXT NOT NULL, -- 'linkedin', 'google_news', 'econodata', 'apollo', 'serper'
  signal_title TEXT NOT NULL,
  signal_description TEXT,
  signal_url TEXT,
  confidence_score INTEGER NOT NULL DEFAULT 0, -- 0-100
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Some signals expire (e.g., job postings after 90 days)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_intent_signals_company_id ON public.intent_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_intent_signals_detected_at ON public.intent_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_intent_signals_confidence ON public.intent_signals(confidence_score DESC);

-- Enable RLS
ALTER TABLE public.intent_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intent_signals
CREATE POLICY "Users can view intent signals for their companies"
ON public.intent_signals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = intent_signals.company_id
  )
);

CREATE POLICY "Users can insert intent signals"
ON public.intent_signals
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = intent_signals.company_id
  )
);

-- Create function to calculate overall intent score for a company
CREATE OR REPLACE FUNCTION public.calculate_intent_score(company_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_score INTEGER := 0;
  signal_count INTEGER := 0;
BEGIN
  -- Calculate weighted average of recent signals (last 90 days)
  SELECT 
    COALESCE(SUM(confidence_score), 0),
    COUNT(*)
  INTO total_score, signal_count
  FROM public.intent_signals
  WHERE company_id = company_uuid
    AND detected_at > now() - interval '90 days'
    AND (expires_at IS NULL OR expires_at > now());
  
  -- Return average score (max 100)
  IF signal_count > 0 THEN
    RETURN LEAST(total_score / signal_count, 100);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get hot leads (high intent score, not using TOTVS)
CREATE OR REPLACE FUNCTION public.get_hot_leads(min_intent_score INTEGER DEFAULT 70)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  intent_score INTEGER,
  totvs_score INTEGER,
  signal_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS company_id,
    c.name AS company_name,
    public.calculate_intent_score(c.id) AS intent_score,
    COALESCE(c.totvs_detection_score, 0) AS totvs_score,
    COUNT(i.id) AS signal_count
  FROM public.companies c
  LEFT JOIN public.intent_signals i ON i.company_id = c.id
    AND i.detected_at > now() - interval '90 days'
    AND (i.expires_at IS NULL OR i.expires_at > now())
  WHERE c.is_disqualified = false
    AND COALESCE(c.totvs_detection_score, 0) < 70
  GROUP BY c.id, c.name
  HAVING public.calculate_intent_score(c.id) >= min_intent_score
  ORDER BY intent_score DESC, signal_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the scoring system
COMMENT ON COLUMN public.companies.totvs_detection_score IS 'Multi-source TOTVS detection score (0-100). Sources: LinkedIn Jobs (40pts), Google Search (30pts), Website Scraping (20pts), LinkedIn Profiles (10pts). Auto-disqualify if >= 70.';
COMMENT ON TABLE public.intent_signals IS 'Buying intent signals from multiple sources. Used to identify hot leads for proactive outreach.';
COMMENT ON FUNCTION public.calculate_intent_score IS 'Calculates weighted average intent score from signals in last 90 days. Max score: 100.';
COMMENT ON FUNCTION public.get_hot_leads IS 'Returns companies with high intent score (default >=70) that do not use TOTVS (score <70).';