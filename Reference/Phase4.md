# 🔵 **PHASE 4 — Real-Time Communication Layer**

## 🎯 **Objective**
Enable the "Magic" of the application: live chat updates. The frontend must listen to database changes immediately without manual refreshing.

---

## **4.1 Supabase Realtime Architecture**

We will use **Postgres Changes** listening.
-   **Channel:** `room:[conversation_id]`
-   **Event:** `INSERT` on table `messages`
-   **Action:** Append new message to UI state.

---

## **4.2 Client-Side Subscription Hook**

Create a custom hook `useChatRealtime.ts` to encapsulate this logic.

```typescript
// hooks/useChatRealtime.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types';

export const useChatRealtime = (
  conversationId: string | null, 
  onNewMessage: (msg: Message) => void
) => {
  useEffect(() => {
    if (!conversationId) return;

    console.log("Subscribing to:", conversationId);

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log("New message received:", payload.new);
          onNewMessage(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onNewMessage]);
};
```

**Usage in Chat Component:**
```tsx
const [messages, setMessages] = useState<Message[]>([]);

useChatRealtime(conversationId, (newMessage) => {
  setMessages((prev) => [...prev, newMessage]);
});
```

---

## **4.3 Admin Dashboard Realtime**

The admin needs to listen to **ALL** conversations to see when a new one starts or a message arrives.

**1. Listen for New Conversations:**
```typescript
const channel = supabase
  .channel('admin-global')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'conversations' },
    (payload) => {
      // Add to "Active Chats" list sidebar
      addNewConversationToSidebar(payload.new);
    }
  )
  .subscribe();
```

**2. Listen for Incoming Messages (Global or Per Active Tab):**
For the active chat window in the admin panel, reuse the `useChatRealtime` hook logic with the selected `conversationId`.

---

## **4.4 Typing Indicators (Optional Enhancement)**

Supabase Realtime supports "Broadcast" mode which is faster and ephemeral (not saved to DB).

**To implement:**
1.  **Channel:** `room:[conversation_id]` (same as above).
2.  **Event:** `typing`
3.  **Code:**
    ```typescript
    // Send
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: 'admin' },
    });
    
    // Receive
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      setShowTyping(true);
      // Debounce hide...
    });
    ```
*Note: This is strictly optional for Phase 4 but recommended for UX.*

---

## **4.5 Handling Double-Updates**

**Problem:** When you send a message, you might optimistically add it to the UI *AND* receive it via Realtime, causing a duplicate.

**Solution:**
1.  **Optimistic UI:** Add message to state immediately with status `sending`.
2.  **Realtime Event:** When the INSERT event arrives, check if a message with that ID (or unique timestamp/local-id) already exists. If yes, replace/confirm it. If no, append it.
3.  **Alternative:** Don't add optimistically. Wait for the Realtime event. (Slower perceived speed, but simpler code). **Start with this approach for the MVP.**

---

## 🟢 **Phase 4 Completion Criteria**

-   [ ] Opening two browser tabs (User A and Admin) works.
-   [ ] Sending a message from User A instantly appears in Admin's view.
-   [ ] Sending a message from Admin Instantly appears in User A's view.
-   [ ] No page refreshes are required for conversation flow.
