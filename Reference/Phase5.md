# 🔵 **PHASE 5 — Frontend (Public UI + Chat System)**

## 🎯 **Objective**
Build the visual layer where users interact with your portfolio and the AI bot.

---

## **5.1 Layout & Global Structure**

We need the chat widget to be persistent across all pages.

**`app/layout.tsx`**:
```tsx
import { ChatWidget } from '@/components/chat/ChatWidget';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <main>{children}</main>
        {/* Floating Chat Widget available on every page */}
        <ChatWidget />
      </body>
    </html>
  );
}
```

---

## **5.2 Chat Components Architecture**

**Folder:** `components/chat/`

### **5.2.1 `ChatWidget.tsx`**
The floating button that opens the window.
-   **State:** `isOpen` (boolean).
-   **UI:** Fixed button bottom-right.
-   **Logic:** Toggles `ChatWindow`.

### **5.2.2 `ChatWindow.tsx`**
The actual messaging interface.
-   **Logic:**
    1.  On mount: Check `localStorage.getItem('conversationId')`.
    2.  If missing: Call `POST /api/chat/start`, save ID to storage.
    3.  Fetch history: `GET /api/chat/[id]`.
    4.  Subscribe: `useChatRealtime(id)`.
-   **UI:**
    -   Header (Close button, Admin status indicator).
    -   `MessageList` (Scrollable area).
    -   `ChatInput` (Text area + Send button).

### **5.2.3 `MessageBubble.tsx`**
Renders a single message.
-   **Props:** `{ message: Message }`
-   **Styling:**
    -   User: `bg-blue-600 text-white ml-auto`
    -   Bot: `bg-gray-100 text-gray-800 mr-auto`
    -   Admin: `bg-purple-600 text-white mr-auto` (Distinguish admin from bot!)

---

## **5.3 Portfolio Pages**

### **5.3.1 Homepage (`page.tsx`)**
-   **Hero Section:** High-impact introduction.
-   **Experience Section:** Fetch data from `experience` table (via server component) and map to a timeline component.
-   **Skills Section:** Group skills by category.

**Data Fetching Example (Server Component):**
```tsx
import { supabase } from '@/lib/supabase';

export default async function ExperienceSection() {
  const { data: experience } = await supabase
    .from('experience')
    .select('*')
    .order('start_date', { ascending: false });

  return (
    <div className="space-y-4">
      {experience?.map((job) => (
        <div key={job.id} className="border p-4 rounded">
          <h3 className="font-bold">{job.role} @ {job.company}</h3>
          <p>{job.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## **5.4 Error Handling & UX**

1.  **Loading States:** Use Skeletons (`shadcn/ui/skeleton`) while fetching chat history.
2.  **Streaming:** If possible, stream the AI response text token-by-token (Phase 8 optimization, but keep in mind). For now, show "AI is typing..." while waiting for the full response.
3.  **Auto-Scroll:**
    ```tsx
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    ```

---

## 🟢 **Phase 5 Completion Criteria**

-   [ ] Floating chat button appears on all pages.
-   [ ] Clicking opens the chat window.
-   [ ] On first open, a new user/conversation row is created in DB.
-   [ ] Chat history persists on page reload (fetched from API).
-   [ ] Portfolio sections (Experience, Projects) render data from Supabase.
