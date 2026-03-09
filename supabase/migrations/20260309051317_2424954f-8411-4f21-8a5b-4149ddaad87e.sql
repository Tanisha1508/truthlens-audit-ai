CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL DEFAULT 'analyze-claims',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_ip_endpoint_time ON public.rate_limits (ip_address, endpoint, requested_at DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Cleanup function to delete entries older than 1 hour
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE requested_at < now() - interval '1 hour';
$$;

-- Function to check and record rate limit (returns true if allowed)
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_ip TEXT, p_endpoint TEXT, p_max_requests INT DEFAULT 10)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  -- Clean old entries
  DELETE FROM public.rate_limits WHERE requested_at < now() - interval '1 hour';
  
  -- Count recent requests
  SELECT COUNT(*) INTO recent_count
  FROM public.rate_limits
  WHERE ip_address = p_ip
    AND endpoint = p_endpoint
    AND requested_at > now() - interval '1 hour';
  
  IF recent_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Record this request
  INSERT INTO public.rate_limits (ip_address, endpoint) VALUES (p_ip, p_endpoint);
  RETURN TRUE;
END;
$$;