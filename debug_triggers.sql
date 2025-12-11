-- List all triggers on the public.users table
SELECT 
    trg.tgname AS trigger_name,
    proc.proname AS function_name,
    pg_get_functiondef(proc.oid) AS function_definition
FROM pg_trigger trg
JOIN pg_proc proc ON trg.tgfoid = proc.oid
WHERE trg.tgrelid = 'public.users'::regclass;
