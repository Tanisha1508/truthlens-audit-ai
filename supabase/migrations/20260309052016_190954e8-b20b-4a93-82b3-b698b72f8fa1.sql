-- Revoke public access to rate limit functions so only service_role can call them
REVOKE EXECUTE ON FUNCTION public.check_rate_limit FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits FROM anon, authenticated;

-- Replace check_rate_limit to hardcode the max_requests parameter
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_ip text, p_endpoint text, p_max_requests integer DEFAULT 10)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count INT;
  hard_limit CONSTANT INT := 10;
BEGIN
  -- Ignore caller-supplied p_max_requests, use hardcoded limit
  DELETE FROM public.rate_limits WHERE requested_at < now() - interval '1 hour';
  
  SELECT COUNT(*) INTO recent_count
  FROM public.rate_limits
  WHERE ip_address = p_ip
    AND endpoint = p_endpoint
    AND requested_at > now() - interval '1 hour';
  
  IF recent_count >= hard_limit THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.rate_limits (ip_address, endpoint) VALUES (p_ip, p_endpoint);
  RETURN TRUE;
END;
$$;

-- Add a deny-all RLS policy on rate_limits (service_role bypasses RLS)
CREATE POLICY "Deny all direct access" ON public.rate_limits
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);