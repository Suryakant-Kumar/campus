# CampusConnect

CampusConnect is a multi-tenant campus issue resolution platform built with a strictly stateless architecture for seamless deployment on Vercel or cloud containers.

Admins register on the main site, provision an isolated campus domain (university, school, hostel, PG, residential society, other) with a link like `<campus>.campusconnect.com`. Users only ever access their designated campus link to report, upvote, and discuss issues. Facility workers and admins inspect, assign, and resolve them.

---

## Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Node.js, Express (Stateless, zero local files, no in-memory sessions).
- **Database**: PostgreSQL (Neon) accessed via `DATABASE_URL` with SSL connection pooling (`pg.Pool`).
- **AI Triage**: Google Gemini API (`@google/genai` TypeScript SDK with model `gemini-3.8-flash`) executed server-side. Evaluates report clarity (1–10), infers urgency, flags spam/harassment, and generates actionable maintenance instructions for workers. Falls back to a deterministic rule-based keyword analyzer if the key is absent or unreachable.
- **Authentication**: Scrypt password hashing with per-user salt and HMAC SHA-256 signed session tokens with 7-day expiration.
- **Photo Storage**: Online cloud storage (Vercel Blob / Supabase Storage). No files are saved to the server's local disk.
- **Live Updates**: Client polling interval (4–5s), stateless without server memory.

---

## Role Hierarchy & Access Control

1. **User (Member)**:
   - Raised issues on their campus.
   - Upvotes issues and participates in discussions.
   - Restricted strictly to their own campus.
2. **Worker (Field Staff)**:
   - Views tickets assigned to them or claims unassigned tickets from the campus pool.
   - Updates ticket status (`in_progress` -> `resolved`).
   - Submits resolution notes and after-repair photo proof.
   - Reads and posts internal staff notes.
3. **Co-Admin (Operations Dispatcher)**:
   - Triages incoming reports.
   - Assigns maintenance workers to pending tickets.
   - Modifies priority and urgency levels.
4. **Admin (Campus Owner)**:
   - Full management of their campus.
   - Invites and removes workers and co-admins.
   - Reviews campus resolution analytics and category breakdowns.
   - Confined strictly to their own campus.
5. **Founder (Global System Super-Admin)**:
   - Global visibility across all campuses.
   - Inspects cross-campus platform metrics, user counts, and critical hazards.

---

## Local Development Setup

### 1. Prerequisites
- Node.js 18+ or 20+
- PostgreSQL database URL (Free tier from [Neon](https://neon.tech))

### 2. Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your `.env`:
```env
DATABASE_URL="postgresql://username:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
SESSION_SECRET="your-ultra-secure-hmac-sha256-key-32chars"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.8-flash"
BLOB_READ_WRITE_TOKEN="optional_vercel_blob_token"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
The server starts at `http://localhost:3000`.

### 5. Production Build
```bash
npm run build
npm start
```

---

## Stateless Cloud Deployment (e.g. Vercel)
1. Push to GitHub.
2. Link repository to Vercel.
3. Add environment variables in Vercel Project Settings:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `GEMINI_API_KEY`
   - `BLOB_READ_WRITE_TOKEN`
4. Deploy! The PostgreSQL schema initializes automatically on first request.
