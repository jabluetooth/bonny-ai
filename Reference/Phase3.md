# 🔵 **PHASE 3 — Backend Core (APIs + LLM Integration)**

## 🎯 **Objective**
Implement the specific API Endpoints to handle chat logic, admin commands, and data retrieval. This forms the "brain" of the application.

---

## **3.1 Chat API Endpoints**

### **3.1.1 POST /api/chat/start**

**Purpose:** Initializing a session for a new visitor.
**Logic:**
1.  Check for existing cookie/local storage ID.
2.  If none, generate new `user_id`.
3.  Insert into `users` table.
4.  Create a new row in `conversations`.
5.  Return `{ conversationId, userId }`.

```typescript
// app/api/chat/start/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // logic to access DB

export async function POST() {
  // 1. Create User
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({})
    .select()
    .single();

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  // 2. Start Conversation
  const { data: convo, error: convoError } = await supabase
    .from('conversations')
    .insert({ user_id: user.id })
    .select()
    .single();

  return NextResponse.json({ 
    userId: user.id, 
    conversationId: convo.id 
  });
}
```

### **3.1.2 POST /api/chat/send**

**Purpose:** Handle user messages and trigger AI response.
**Logic:**
1.  **Validate:** Ensure content is not empty.
2.  **Save User Message:** Insert `sender_type: 'user'` into DB.
3.  **Check Status:** Query `conversations` table.
    -   If `assigned_admin_id` is NOT NULL: **STOP**. (Admin will reply manually).
    -   If `assigned_admin_id` is NULL: **PROCEED** to AI.
4.  **AI Generation:**
    -   Fetch relevant context (projects/skills) from DB.
    -   Call LLM (OpenAI/HuggingFace) with system prompt.
5.  **Save AI Message:** Insert `sender_type: 'bot'` into DB.
6.  **Return:** Stream response or JSON.

```typescript
// app/api/chat/send/route.ts
import { supabase } from '@/lib/supabase';
// ... import LLM provider ...

export async function POST(req: Request) {
  const { conversationId, content } = await req.json();

  // 1. Save User Message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_type: 'user',
    content
  });

  // 2. Check Admin Status
  const { data: convo } = await supabase
    .from('conversations')
    .select('assigned_admin_id')
    .eq('id', conversationId)
    .single();

  if (convo?.assigned_admin_id) {
    return Response.json({ status: 'sent_to_admin' });
  }

  // 3. AI Logic
  const systemPrompt = "You are Fil, a web developer. Answer based on these projects: ...";
  const aiResponse = await generateLLMResponse(content, systemPrompt);

  // 4. Save Bot Message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_type: 'bot',
    content: aiResponse
  });

  return Response.json({ reply: aiResponse });
}
```

### **3.1.3 GET /api/chat/[id]**
**Purpose:** Fetch message history on page load.
**Logic:**
-   `select * from messages where conversation_id = [id] order by created_at asc`

---

## **3.2 Admin API Endpoints**

Protected by ensuring the caller is the authenticated Admin.

### **3.2.1 POST /api/admin/takeover**
**Logic:**
-   Update `conversations` table.
-   Set `assigned_admin_id` = `[Admin UUID]`.

```typescript
// app/api/admin/takeover/route.ts
export async function POST(req: Request) {
  const { conversationId, adminId } = await req.json();
  
  const { error } = await supabase
    .from('conversations')
    .update({ assigned_admin_id: adminId })
    .eq('id', conversationId);

  return Response.json({ success: !error });
}
```

### **3.2.2 POST /api/admin/release**
**Logic:**
-   Update `conversations` table.
-   Set `assigned_admin_id` = `NULL`.
-   AI resumes control.

### **3.2.3 POST /api/admin/send**
**Logic:**
-   Same as chat send, but `sender_type: 'admin'`.
-   No AI trigger.

---

## **3.3 Portfolio API (CRUD)**

Create standard Next.js route handlers for managing content.

-   `GET /api/portfolio/projects` (Public: fetch all)
-   `POST /api/portfolio/projects` (Admin: create new)
-   `PUT /api/portfolio/projects` (Admin: update)
-   `DELETE /api/portfolio/projects` (Admin: delete)

*Repeat for Experience, Skills, About tables.*

---

## **3.4 LLM Integration Details**

For the MVP, use a simple prompt injection strategy:

1.  **Retrieve Context:**
    ```typescript
    const { data: projects } = await supabase.from('projects').select('*');
    const { data: skills } = await supabase.from('skills').select('*');
    const contextString = JSON.stringify({ projects, skills });
    ```

2.  **Construct System Prompt:**
    ```text
    You the AI portfolio assistant for Fil. 
    Here is his data: ${contextString}.
    Answer the user's question accurately. Be brief and professional.
    ```

---

## 🟢 **Phase 3 Completion Criteria**

-   [ ] `POST /api/chat/start` creates a user and conversation in DB.
-   [ ] `POST /api/chat/send` saves user message to DB.
-   [ ] AI replies are generated and saved to DB (when no admin is assigned).
-   [ ] Admin `takeover` endpoint updates the database correctly.
-   [ ] Postman/Curl tests verify all endpoints work.
