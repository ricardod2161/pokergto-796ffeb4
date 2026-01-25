-- Create table to track daily AI usage per user
CREATE TABLE public.daily_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  analysis_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage" 
ON public.daily_usage 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert own usage" 
ON public.daily_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update own usage" 
ON public.daily_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can view all usage
CREATE POLICY "Admins can view all usage" 
ON public.daily_usage 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_usage_updated_at
BEFORE UPDATE ON public.daily_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment usage and check limits
CREATE OR REPLACE FUNCTION public.increment_daily_usage(p_user_id UUID)
RETURNS TABLE(current_count INTEGER, daily_limit INTEGER, can_use BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan subscription_plan;
  v_current_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get user's subscription plan
  SELECT COALESCE(s.plan, 'free') INTO v_plan
  FROM subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active'
  LIMIT 1;
  
  -- Set limit based on plan
  v_limit := CASE 
    WHEN v_plan = 'premium' THEN -1  -- -1 means unlimited
    WHEN v_plan = 'pro' THEN -1      -- -1 means unlimited
    ELSE 5                            -- free plan: 5 per day
  END;
  
  -- Upsert daily usage
  INSERT INTO daily_usage (user_id, usage_date, analysis_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET 
    analysis_count = daily_usage.analysis_count + 1,
    updated_at = now()
  RETURNING daily_usage.analysis_count INTO v_current_count;
  
  -- Return results
  current_count := v_current_count;
  daily_limit := v_limit;
  can_use := (v_limit = -1) OR (v_current_count <= v_limit);
  RETURN NEXT;
END;
$$;

-- Create function to get current usage without incrementing
CREATE OR REPLACE FUNCTION public.get_daily_usage(p_user_id UUID)
RETURNS TABLE(current_count INTEGER, daily_limit INTEGER, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan subscription_plan;
  v_current_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get user's subscription plan
  SELECT COALESCE(s.plan, 'free') INTO v_plan
  FROM subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active'
  LIMIT 1;
  
  -- If no subscription found, default to free
  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;
  
  -- Set limit based on plan
  v_limit := CASE 
    WHEN v_plan = 'premium' THEN -1
    WHEN v_plan = 'pro' THEN -1
    ELSE 5
  END;
  
  -- Get current count
  SELECT COALESCE(du.analysis_count, 0) INTO v_current_count
  FROM daily_usage du
  WHERE du.user_id = p_user_id AND du.usage_date = CURRENT_DATE;
  
  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;
  
  -- Return results
  current_count := v_current_count;
  daily_limit := v_limit;
  remaining := CASE WHEN v_limit = -1 THEN -1 ELSE GREATEST(0, v_limit - v_current_count) END;
  RETURN NEXT;
END;
$$;