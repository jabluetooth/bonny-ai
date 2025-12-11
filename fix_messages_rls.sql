-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own messages (Crucial for counting!)
CREATE POLICY "Users can read own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = (select user_id from conversations where id = conversation_id));
-- Note: The above assumes a 'conversations' table linking to user_id. 
-- If 'messages' has 'user_id' or 'sender_id', adjust accordingly.
-- Based on the code: messages has 'sender_type'='user', but not explicitly 'user_id' column in the insert?
-- Wait, let's check schema assumptions. The send route inserts: { conversation_id, sender_type: 'user', content }.
-- It does NOT insert user_id.
-- So how do we know it's THE USER'S message?
-- We rely on the conversation connection. 
-- BUT we haven't seen the `conversations` table definition.

-- SIMPLER POLICY FOR NOW (if RLS is the issue):
-- Allow users to select messages belonging to conversations they own.
-- This requires joining conversations.

-- ALTERNATIVE:
-- Just allow authenticated users to SELECT messages where sender_type = 'user' AND conversation_id in (select id from conversations where user_id = auth.uid())

-- Let's try a safer, broader policy first to unblock the COUNT.
-- Assuming the user is authenticated (auth.uid() is not null).

CREATE POLICY "Users can read messages in their conversations"
ON public.messages
FOR SELECT
USING (
    exists (
        select 1 from conversations c
        where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
);

-- Also ensure Insert is allowed (it seems to be working, but good to be sure)
CREATE POLICY "Users can insert messages"
ON public.messages
FOR INSERT
WITH CHECK (
    exists (
        select 1 from conversations c
        where c.id = conversation_id
        and c.user_id = auth.uid()
    )
);
