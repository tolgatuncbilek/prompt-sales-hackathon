# Email Integration — AI Agent Awareness

Make the AI agent (OpenClaw/Hermes) aware of email correspondence with
contacts by ingesting emails into the CRM activity timeline and including
them in the context payload sent to the AI.

## Architecture

```
Email arrives
    │
    ▼
Provider (Outlook/Gmail) sends webhook notification to CRM
    │
    ▼
CRM writes activity row (event_type: email_received / email_sent)
    │
    ▼
PostgreSQL ─── stored alongside deals, cases, offers
    │
    ▼
When OpenClaw/Hermes runs, CRM assembles context payload
including recent activities → AI sees email history
    │
    ▼
AI agent can reference email content in answers and drafts
```

No new tables, no auto-sending — emails are just another data source the
AI reads from, consistent with the "AI insights are suggestions only"
principle.

---

## Phase 1 — Email ingestion webhook

### Database

Existing `activities` table handles this. Reuse it with:

```typescript
event_type: 'email_received' | 'email_sent'
payload: {
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  subject: string;
  snippet: string;       // first ~200 chars or preview
  messageId: string;     // provider's unique ID for dedup
  accountId?: string;    // matched by domain on from/to
  contactEmail?: string; // matched contact for UI linking
}
```

### Endpoint

New route at `POST /api/webhooks/email` that:

1. Validates a shared secret token (`EMAIL_WEBHOOK_SECRET`)
2. Extracts email metadata from the provider's payload
3. Matches sender/recipient domain to an existing account
4. Writes an `activities` row
5. Returns 200

### Provider setup

**Microsoft Graph (Outlook/365)**

Create a change notification subscription:

```
POST https://graph.microsoft.com/v1.0/subscriptions
Content-Type: application/json
Authorization: Bearer {token}

{
  "changeType": "created",
  "notificationUrl": "https://your-crm.com/api/webhooks/email",
  "resource": "users/{mailbox}/mailFolders/inbox/messages",
  "clientState": "{verification-token}",
  "expirationDateTime": "2026-07-13T00:00:00Z"
}
```

Requires: Azure app registration with `Mail.Read` delegated permission,
admin consent, and a token refresh mechanism.

**Gmail**

Use Gmail API `watch()` to push to a Pub/Sub topic, then pull from Pub/Sub
in the webhook handler or a small polling worker.

Requires: GCP project, Pub/Sub topic + subscription, service account with
`gmail.users.watch` scope.

---

## Phase 2 — Context payload expansion

### Assistant (`src/server/routes/assistant.ts`)

Include contacts with email addresses in the CRM snapshot sent to Hermes:

```typescript
const contactRows = await db
  .select()
  .from(contacts)
  .orderBy(contacts.name)
  .limit(300);

// Add to snapshot object:
contacts: trimSnapshot(contactRows, 100),
```

Also include recent email-type activities that might not appear in the
general activity window:

```typescript
// Already covered by recentActivities which includes all event types
```

### Webhook receiver (`src/server/routes/webhooks.ts`)

Persist the `suggested_email_draft` field from OpenClaw responses:

```typescript
// When writing a next_action insight:
if (result.next_action?.suggested_email_draft) {
  // Store as part of the insight body or write as separate activity
}
```

---

## Phase 3 — AI-composed email drafts

Build on the existing `kind: 'draft'` action in the assistant response
(`assistant.ts:23`):

1. Assistant proposes an email with recipient, subject, body
2. UI shows it as a preview with "Copy" / "Open in mail client" buttons
3. Never auto-send — aligns with "AI suggestions are suggestions only"

No infrastructure changes needed; this is entirely frontend.

---

## Config

Add to `.env` / Azure Container Apps secrets:

```
EMAIL_WEBHOOK_SECRET=<shared-secret>
EMAIL_WEBHOOK_ENABLED=true

# For IMAP fallback (alternative to webhooks):
EMAIL_IMAP_HOST=imap.hmdsecure.com
EMAIL_IMAP_PORT=993
EMAIL_IMAP_USER=crm@hmdsecure.com
EMAIL_IMAP_PASS=<password>
```

---

## Out of scope

- Email notifications (per README constraint — in-app only)
- Automatic email sending
- Email attachments (store message IDs only, not blobs)
- Full-text search of email bodies (snippet only)
