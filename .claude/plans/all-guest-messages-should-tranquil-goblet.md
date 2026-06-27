# Plan: Add Approval Column to Guestbook Messages

## Context
The user wants all guestbook messages to be reviewed and approved before being displayed online. Currently, all submitted messages are shown immediately. We need to:
1. Add a boolean `approved` column to the `guestbookmessage` table (default `true` for existing rows so they remain visible).
2. Modify the submission logic to set `approved = false` for new messages.
3. Update: We decided to automatically approve existing messages (per user answer).
4. Modify the query that fetches guestbook messages for display to only show approved ones.
5. Create an admin interface (protected via environment variable) to list pending approvals and approve/reject messages.

## Implementation Steps

### 1. Database Schema Update
- Edit `prisma/schema.prisma` to add `approved Boolean @default(true)` to the `GuestbookMessage` model.
- Run `npx prisma migrate dev --name add-approval-to-guestbook` to generate and apply the migration.
- This will set the default to `true` for existing rows, making them visible immediately (as requested).

### 2. Update Submission Logic
In `app/actions.ts`, function `submitGuestbookMessage`:
- In the `create` call (anonymous message), add `approved: false`.
- In the `upsert` update, set `approved: false` (so updating an existing message resets approval to false, requiring re-approval).
- In the `upsert` create branch, also set `approved: false`.

### 3. Update Guestbook Query
In `app/page.tsx`, modify the `prisma.guestbookMessage.findMany` call to include `where: { approved: true }`.

### 4. Admin Interface
Create a new route `app/admin/guestbook/page.tsx` (or `route.ts` for API) that:
- Is protected by checking an environment variable (e.g., `ADMIN_TOKEN`) via a simple bearer token or cookie.
- Fetches guestbook messages where `approved = false` (pending).
- Provides buttons to approve (set `approved: true`) or reject (delete or set to false? We'll implement approve only; rejection can be delete).
- Uses server actions or API routes to mutate the approval status.

We'll implement as a server component with server actions for simplicity.

Protection: Check if request headers contain `Authorization: Bearer <ADMIN_TOKEN>` where `ADMIN_TOKEN` is set in `.env`. If not present or incorrect, return 401.

### 5. Environment Variables
Add to `.env` (example):
```
ADMIN_TOKEN=your-secret-token-here
```
(We'll note that the user should set this.)

### 6. Files to Modify
- `prisma/schema.prisma`
- `app/actions.ts` (submitGuestbookMessage function)
- `app/page.tsx`
- New file: `app/admin/guestpage.tsx` (or `app/admin/guestbook/page.tsx`)
- Possibly new file: `app/admin/guestbook/action.ts` for server actions (or put in existing actions.ts)

### 7. Verification Steps
1. Start dev server.
2. Submit a new guestbook message (via the form).
3. Verify the message does not appear on the homepage.
4. Access the admin page (with correct token) and see the pending message.
5. Approve the message via admin UI.
6. Refresh homepage and see the message appear.
7. Test that existing messages (from before migration) are still visible.
8. Test that updating an existing message (via guest upsert) resets approval to false and hides it until re-approved.

### 8. Notes
- The upsert logic currently updates `name` and `message` when a guest submits again. We will also reset `approved` to false on update.
- For anonymous messages, there is no guestId, so each submission creates a new row. That's fine.
- We should also consider adding a `reviewedBy` or `reviewedAt` field? Not required; we can keep it simple.

## Detailed Changes

### prisma/schema.prisma
```diff
model GuestbookMessage {
  id        String   @id @default(uuid())
  name      String
  message   String
  createdAt DateTime @default(now())
  guest     Guest?   @relation("GuestGuestbookMessages", fields: [guestId], references: [id])
  guestId   String?
+  approved  Boolean  @default(true)

  @@unique([guestId])
}
```

### app/actions.ts (submitGuestbookMessage)
In the create branch (anonymous):
```diff
const newMsg = await prisma.guestbookMessage.create({
  data: { 
    name, 
    message,
+   approved: false,
  },
});
```

In the upsert update:
```diff
const upserted = await prisma.guestbookMessage.upsert({
  where: { guestId: guestId },
  update: { 
    name, 
    message,
+   approved: false, // reset approval on update
  },
  create: { 
    name, 
    message, 
    guestId,
+   approved: false,
  },
});
```

### app/page.tsx
```diff
const [defaultGuest, guestbookMessages] = await Promise.all([
  prisma.guest
    .findUnique({
      where: { slug: "bạn" },
    })
    .catch(() => null),
  prisma.guestbookMessage
    .findMany({
      where: { approved: true }, // only show approved
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []),
]);
```

### Admin Interface (app/admin/guestbook/page.tsx)
We'll create a server component that:
- Checks authorization via header.
- Shows a table of pending messages (approved: false).
- Each row has an Approve button that calls a server action to set approved: true.
- Optionally a Delete button to remove spam.

We'll need to create a server action for approving (and maybe deleting) in `app/actions.ts` or a separate file.

Let's add to `app/actions.ts`:
```typescript
export async function approveGuestbookMessage(id: string) {
  // check admin token from headers? Actually server actions can't get headers easily.
  // Better to use an API route for admin actions.
}
```
Thus, we might implement admin as an API route (`app/admin/guestbook/route.ts`) that handles GET (list) and PATCH (approve) and DELETE.

We'll do:
- `app/admin/guestbook/route.ts`:
  - GET: require auth, return pending messages.
  - PATCH: require auth, approve a message by id.
  - DELETE: require auth, delete a message.

Protection: check `Authorization` header against `process.env.ADMIN_TOKEN`.

### 9. Dependencies
No new dependencies needed.

### 10. Risks
- Existing messages will be automatically approved (as per user request). If the user later changes mind, they'd need to manually approve in DB.
- Ensure that the admin protection is strong enough; we'll use a simple token but note that it's not as robust as full auth. However, the user requested simple protection via env var.

## Conclusion
This plan satisfies the user's requirement to have guestbook messages moderated before appearing online, with a simple admin interface for approval.
