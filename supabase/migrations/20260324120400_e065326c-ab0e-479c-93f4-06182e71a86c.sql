-- Per-user AI usage tracking (rate limiting)
CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_time ON public.ai_usage_log (user_id, function_name, created_at DESC);

CREATE OR REPLACE FUNCTION public.cleanup_old_ai_usage()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.ai_usage_log WHERE created_at < now() - interval '2 days';
$$;

-- Response cache for common questions
CREATE TABLE public.ai_response_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  function_name text NOT NULL,
  response_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  hit_count int NOT NULL DEFAULT 0
);

CREATE INDEX idx_ai_cache_key ON public.ai_response_cache (cache_key);
CREATE INDEX idx_ai_cache_created ON public.ai_response_cache (created_at);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_ai_usage_today(
  _user_id uuid,
  _function_name text
)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.ai_usage_log
  WHERE user_id = _user_id
    AND function_name = _function_name
    AND created_at > date_trunc('day', now());
$$;