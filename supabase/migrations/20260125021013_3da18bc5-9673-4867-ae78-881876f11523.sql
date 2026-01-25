-- Function to reset daily usage for a specific user
CREATE OR REPLACE FUNCTION public.reset_user_daily_usage(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete today's usage record for the user
  DELETE FROM daily_usage 
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  
  RETURN true;
END;
$$;

-- Function to reset daily usage for all users (admin only)
CREATE OR REPLACE FUNCTION public.reset_all_daily_usage()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete all usage records for today
  DELETE FROM daily_usage WHERE usage_date = CURRENT_DATE;
  
  RETURN true;
END;
$$;