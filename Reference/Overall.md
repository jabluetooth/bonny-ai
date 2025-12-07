

---

# 📘 **RAD — Requirements & Architecture Document**

### _Project: AI Portfolio Website with Chatbot + Admin Live Intervention_

### _Author: Fil Heinz O. Re La Torre

### _Date: 12/7/2025

---

# **1. Project Overview**

## **1.1 Purpose**

This project is a personal portfolio website that includes an AI-powered chatbot capable of answering questions about my experience, skills, and projects. The chatbot can also be taken over manually via an admin dashboard, enabling real-time human interaction when I am online.

## **1.2 Goals**

- Present a modern, interactive portfolio
    
- Allow visitors to engage with an AI chatbot representing me
    
- Provide accurate answers based on stored portfolio data
    
- Allow admin (myself) to intervene in conversations live
    
- Track chat history and user behavior for insights
    

## **1.3 Key Features**

- AI chatbot with dynamic Q/A
    
- Real-time chat interface
    
- Admin dashboard with login protection
    
- Human chatbot takeover
    
- Portfolio data management (projects, experience, skills)
    
- Supabase database integration
    
- Deployed on Vercel
    

---

# **2. System Requirements**

## **2.1 Functional Requirements**

### **Public User**

- View portfolio pages
    
- Start a chat session
    
- Receive AI-generated responses
    
- Continue conversation persistently in a single session
    

### **Admin**

- Login via Google OAuth
    
- Access admin dashboard
    
- View real-time chat streams
    
- Intervene and chat directly
    
- Manage portfolio content (CRUD projects, experience, skills)
    

### **Chatbot**

- Retrieve relevant database data
    
- Answer questions using LLM
    
- Escalate to admin if takeover is triggered
    

## **2.2 Non-Functional Requirements**

- Must load fast (optimized for Vercel)
    
- Secure authentication for admin
    
- Real-time updates with low latency
    
- Scalable DB architecture
    
- Clean, responsive UI
    
- Audit-friendly message logs
    

---

# **3. Tech Stack**

## **3.1 Frontend**

- Next.js 14 (App Router)
    
- React
    
- TailwindCSS
    
- shadcn/ui
    
- Supabase Realtime client
    

## **3.2 Backend**

- Next.js API Routes / Server Actions
    
- Supabase JS SDK
    
- LLM inference API (Hugging Face or open-source model)
    

## **3.3 Database**

**Supabase PostgreSQL**, using tables:

- users
    
- conversations
    
- messages
    
- admin
    
- projects
    
- experience
    
- skills
    
- about
    

## **3.4 Authentication**

- NextAuth.js
    
- Google OAuth (admin only)
    

## **3.5 Real-time**

- Supabase Realtime (Postgres CDC)
    

## **3.6 Hosting**

- Vercel (Frontend + API)
    
- Supabase (Database + Auth + Realtime)
    
- HuggingFace API / Ollama (LLM)
    

---

# **4. System Architecture**

## **4.1 High-Level Diagram**

```
[ Visitor ]  <-->  [ Next.js Frontend (Vercel) ]
       |                         |
       |                     [ Next.js API Routes ]
       |                         |
       v                         v
   [ Supabase DB ]  <------>  [ Admin Dashboard ]
       ^                         |
       |                         |
       |                    [ LLM Inference ]
       |____________________________|
```

---

# **5. Database Design**

## **5.1 Entity Relationship Diagram (ERD)**

```
users (id) 1---∞ conversations (id) 1---∞ messages
admin (id) ----------- manages ----------- conversations

projects
experience
skills
about
```

## **5.2 Table Descriptions**

### **users**

- id (UUID)
    
- created_at
    

### **conversations**

- id
    
- user_id (FK)
    
- assigned_admin_id (nullable)
    
- is_active
    
- created_at
    

### **messages**

- id
    
- conversation_id
    
- sender_type (user | bot | admin)
    
- sender_id (nullable)
    
- content
    
- created_at
    

### **projects / experience / skills / about**

Used to feed the chatbot and render portfolio pages.

---

# **6. System Components**

## **6.1 Chatbot Flow**

1. User sends message
    
2. Saved to DB
    
3. If admin takeover active → forward to admin
    
4. Otherwise → LLM processes the message
    
5. LLM reply saved to DB and streamed to user
    

## **6.2 Admin Takeover Flow**

1. Admin selects conversation
    
2. Admin clicks **“Take Over”**
    
3. System marks conversation as `assigned_admin_id = admin.id`
    
4. LLM stops responding
    
5. Admin messages are sent to user in real-time
    

## **6.3 Portfolio Data Retrieval**

- API route fetches data from Supabase DB
    
- Data injected as context for LLM
    
- LLM generates grounded answers
    

---

# **7. API Endpoints**

### **Public**

- `POST /api/chat/sendMessage`
    
- `GET /api/chat/getMessages`
    

### **Admin**

- `POST /api/admin/takeover`
    
- `POST /api/admin/release`
    
- `POST /api/admin/sendMessage`
    
- `POST /api/portfolio/update` (CRUD)
    

### **LLM**

- `POST /api/llm/generate`
    

---

# **8. Security Considerations**

- Admin-only authentication via OAuth
    
- Supabase RLS rules for least privilege
    
- Secure API routes
    
- Sanitization of messages
    
- HTTPS enforced via Vercel
    

---

# **9. Milestones & Timeline**

### **Phase 1: Setup**

- Create Next.js project
    
- Configure Supabase + schema
    
- Build basic UI
    

### **Phase 2: AI Chatbot**

- Create message flow
    
- Integrate LLM
    
- Implement data grounding (portfolio DB)
    

### **Phase 3: Admin Dashboard**

- Authentication
    
- Real-time chat viewer
    
- Takeover functionality
    

### **Phase 4: Portfolio CMS**

- CRUD pages
    
- Automated LLM retrieval
    

### **Phase 5: Deployment**

- Push to Vercel
    
- Test Supabase integration
    
- Monitor real-time behavior
    

---

# **10. Future Enhancements**

- Vector embeddings (RAG)
    
- Analytics panel
    
- Multi-admin support
    
- Offline/on-device model
    
- Voice input/output
    

---

If you'd like, I can also generate:

- A matching **SRS (Software Requirements Specification)**
    
- A **full ERD diagram in Mermaid**
    
- A **system sequence diagram**
    
- Or a **folder/file structure** for your codebase.