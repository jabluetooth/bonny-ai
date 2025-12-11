-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own data
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy to allow users to insert their own data (for the initial upsert)
CREATE POLICY "Users can insert their own data" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy to allow users to update their own data (CRITICAL FOR NAME CHANGE)
CREATE POLICY "Users can update their own data" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Optional: Allow public read if you want a leaderboard, otherwise keep it private
-- CREATE POLICY "Public can view basics" ON public.users FOR SELECT USING (true);
