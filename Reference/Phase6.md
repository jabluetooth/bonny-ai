# 🔵 **PHASE 6 — Admin Dashboard**

## 🎯 **Objective**
Create the control center. This area must be secure and allow for high-speed interaction with multiple users.

---

## **6.1 Security & Authentication**

### **6.1.1 Middleware Protection**
Create `middleware.ts` in the root:
```typescript
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      // Only allow your specific email
      return token?.email === "your-email@gmail.com";
    },
  },
});

export const config = { matcher: ["/admin/:path*"] };
```
*This ensures no one can access `/admin` without logging in via Google.*

---

## **6.2 Dashboard Layout**

**Files:** `app/admin/layout.tsx`
-   **Sidebar:**
    -   Links: "Active Chats", "Projects", "Experience", "Skills".
    -   **Live List:** A real-time list of active conversations.

**Active Chat List Logic:**
-   Subscribe to `conversations` table.
-   Sort by `updated_at` DESC.
-   Highlight items with `is_active=true`.
-   Show badge for unread messages (if possible).

---

## **6.3 Live Conversation Viewer**

**Route:** `app/admin/chat/[id]/page.tsx`

**Components:**
1.  **Chat View:** Reuses `MessageList` but aligned differently (User on left, Admin on right).
2.  **Control Panel:**
    -   **Takeover Toggle:**
        ```tsx
        <Button 
          onClick={() => toggleTakeover(chatId, !isTakenOver)}
          variant={isTakenOver ? "destructive" : "default"}
        >
          {isTakenOver ? "Release Control" : "Take Over"}
        </Button>
        ```
    -   **Info Panel:** Show `user_id` or other metadata.

3.  **Admin Input:**
    -   Calls `/api/admin/send`.
    -   Should trigger `sender_type: 'admin'`.

---

## **6.4 Portfolio CMS**

Create simple forms to add/edit data.

**Route:** `app/admin/projects/page.tsx`
-   **List:** Table of all projects.
-   **Add Button:** Opens a Shadcn Dialog with a form (`react-hook-form` + `zod`).
-   **Action:**
    -   `onSubmit` → `POST /api/portfolio/projects`.
    -   On success → Refetch list / Revalidate path.

---

## 🟢 **Phase 6 Completion Criteria**

-   [ ] Visiting `/admin` redirects to Google Login.
-   [ ] Non-whitelisted emails are blocked.
-   [ ] Admin dashboard shows sidebar + content area.
-   [ ] "Take Over" button successfully pauses AI (verifiable in DB).
-   [ ] Admin messages appear in the public chat window.
-   [ ] Forms allow creating a new Project and it appears on the homepage.
