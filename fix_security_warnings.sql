-- Fix Security Warning: Set search_path for the function
ALTER FUNCTION public.update_total_users() SET search_path = public;
