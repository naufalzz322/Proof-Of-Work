# Proof of Work Generator — Dokumentasi Aplikasi

## Overview
**Purpose:** Aplikasi dokumentasi digital untuk B2B cleaning service & Event Organizer
**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, PostgreSQL, NextAuth v5, Supabase, Resend, Fonnte (WhatsApp)

---

## 👥 User Roles

| Role | Akses | Dashboard |
|------|-------|----------|
| **ADMIN** | Full access — create jobs, manage workers/clients | `/admin/dashboard` |
| **SUPERVISOR** | Monitor team, view jobs | `/supervisor/dashboard` |
| **FIELD** | Mobile-first — execute jobs on-site | `/field/jobs` |

### Login Credentials (Demo)
```
Admin:       admin@pytagotech.com / admin123
Supervisor:  supervisor@pytagotech.com / admin123
Field:       budi@field.com / field123
```

---

## 🔄 Core Workflow

### Alur Kerja Lengkap

```
ADMIN                           FIELD WORKER                    CLIENT
   │                                  │                           │
   │ 1. Create Job                    │                           │
   │    - Select client                │                           │
   │    - Add areas + checklist        │                           │
   │    - Assign workers               │                           │
   │    - Set schedule                 │                           │
   │    ↓                             │                           │
   │    WhatsApp notification ───────→│ (via Fonnte)              │
   │                                  │                           │
   │ 2. [NOTIF] Admin notified ────────── Admin notified via WhatsApp │
   │                                  │                           │
   │                            3. Check-in (GPS)                │
   │                            - Verify location                 │
   │                            - Geofence 200m radius           │
   │                            ↓                               │
   │                            4. Area-based work              │
   │                            - Upload BEFORE photo             │
   │                            - Complete checklist             │
   │                            - Upload AFTER photo            │
   │                            5. Repeat for all areas         │
   │                                  │                           │
   │                            6. Client Signature             │
   │                            ←────────────────────────────── │
   │                                  │                           │
   │ 7. Generate PDF Report ←─────────────────────────────────── │
   │    (auto after signature)        │                           │
   │                                  │                           │
   │ 8. Email to Client ─────────────────────────────────────── │
   │    9. Admin notified ──────────[NOTIF]───────────────────── │
   │                            10. Job COMPLETED                  │
```

---

## ✅ Features (F-01 to F-10)

| ID | Feature | How It Works | Status |
|----|---------|-------------|--------|
| **F-01** | Job Assignment | Admin creates job → selects client, areas, workers, schedule | ✅ |
| **F-02** | Check-in GPS | Worker checks in → system validates location (200m geofence) | ✅ |
| **F-03** | Foto Before/After | Worker uploads photos per area before/after work | ✅ |
| **F-04** | Checklist Digital | Per-area task list, one-by-one completion | ✅ |
| **F-05** | Tanda Tangan Digital | Client signs on signature pad after work | ✅ |
| **F-06** | Auto-generate PDF | Report auto-generated after signature | ✅ |
| **F-07** | Email PDF | Admin sends report to client via Resend | ✅ |
| **F-08** | Job Templates | Save area structure as reusable template | ✅ |
| **F-09** | Recurring Schedule | Auto-generate jobs daily/weekly/monthly | ✅ |
| **F-10** | Admin Notifications | WhatsApp alerts on job events | ✅ |

---

## 📱 Screen Details by Role

### ADMIN — Back Office

| Feature | Description |
|---------|-------------|
| **Dashboard** | Stats: today's jobs, in-progress, active workers, pending reports |
| **Jobs** | Create/edit jobs with areas + checklist items |
| **Templates** | Create & manage reusable job templates |
| **Recurring** | Set up automatic job generation schedules |
| **Notifications** | View all job event notifications (check-in, completed, signed, etc.) |
| **Workers** | Manage team (add/edit/delete) |
| **Clients** | Manage corporate clients with contact info |
| **Job Detail** | View full job status, download PDF, send email |
| **Email PDF** | "Kirim ke Email" button → send report to client |

#### Admin Job Creation Flow
1. Click "Job Baru" button
2. **(Optional)** Select a template to pre-fill areas
3. Fill form:
   - Title (required)
   - Client (dropdown)
   - Location: Type address → autocomplete suggestions → select → GPS auto-filled
   - Schedule (date + time)
   - Notes (optional)
4. Add Areas:
   - Area name (e.g., "Lobby Lt. 3")
   - Tasks per area
   - Add checklist items per area
   - Or use template to auto-fill
5. Assign Workers:
   - Select from field workers
   - Multiple workers allowed
6. Save → Workers receive WhatsApp notification

---

### SUPERVISOR — Team Monitor

| Feature | Description |
|---------|-------------|
| **Dashboard** | Today's jobs, checked-in workers, progress tracking |
| **Active Workers** | Real-time view of who checked in + progress % |
| **Job List** | All today's jobs with status and checklist progress |
| **View Reports** | Link to PDF reports (read-only) |
| **Notifications** | WhatsApp + in-app alerts when workers check in, job completes |

#### Supervisor Monitoring Flow
1. View today's jobs at a glance
2. See which workers have checked in (real-time WhatsApp notification)
3. Track progress (% checklist complete)
4. Click job to see detail
5. Access PDF report if completed

---

### FIELD — On-Site Worker (Mobile-First)

| Feature | Description |
|---------|-------------|
| **Job List** | Today's jobs, tomorrow's jobs, completed |
| **Job Detail** | Location, schedule, assigned areas |
| **Check-in** | GPS location verification (required before work) |
| **Area View** | See checklist items for selected area |
| **Photos** | Upload BEFORE/AFTER photos per area |
| **Checklist** | Mark items as done one-by-one |
| **Signature** | Client signs on signature pad |

#### Field Worker Job Flow
1. Open "Job Hari Ini" list
2. Click "Mulai Kerja" → Check-in page
3. GPS verification:
   - ✅ In range → "Konfirmasi Check-in"
   - ⚠️ Out of range → Must provide reason to override
4. After check-in → See all areas
5. Per area:
   - Take BEFORE photo
   - Complete checklist items (tap to toggle done)
   - Take AFTER photo (only after all items done)
6. All areas complete → "Minta Tanda Tangan"
7. Client signs on signature pad
8. Auto-generate PDF report
9. Job marked COMPLETED

---

## 🛠️ Technical Details

### Database Models (Prisma)

```
Client
├── id, name, contactName, contactTitle, contactPhone, contactEmail, address
├── jobs[]
└── recurringSchedules[]

Worker
├── id, name, email, passwordHash, phone, role (ADMIN/SUPERVISOR/FIELD)
└── sessions[]

Job
├── id, jobNumber, clientId, title, description
├── locationAddress, locationLat, locationLng, locationRadius
├── scheduledDate, scheduledTime, status, notes
├── status: DRAFT | ASSIGNED | IN_PROGRESS | COMPLETED | INVOICED
├── areas[], workers[], signature, report
└── WorkSession (jobId, workerId, checkInAt, checkInLat, checkInLng, isOverrideLocation)

JobArea
├── id, jobId, name, sortOrder
└── items[], photos[]

ChecklistItem
├── id, areaId, label, isDone, doneAt, doneBy

AreaPhoto
├── id, areaId, type (BEFORE/AFTER), url, takenAt, uploadedBy

ClientSignature
├── id, jobId, signatureUrl, signerName, signerTitle, signedAt

JobReport
├── id, jobId, pdfUrl, generatedAt, sentAt, sentToEmail

JobTemplate
├── id, name, description, createdBy
└── areas[] (JobTemplateArea → JobTemplateItem)

RecurringSchedule
├── id, clientId, title, locationAddress
├── recurrence (DAILY | WEEKLY | MONTHLY)
├── daysOfWeek[], dayOfMonth
├── isActive, lastGenerated, endDate

AdminNotification
├── id, type, title, message, jobId, jobNumber
├── isRead, sentVia[], createdAt
```

### API Endpoints

#### Admin APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/jobs` | List all jobs |
| POST | `/api/admin/jobs` | Create new job + WhatsApp notification |
| GET | `/api/admin/jobs/[id]` | Get job detail |
| PATCH | `/api/admin/jobs/[id]` | Update job |
| DELETE | `/api/admin/jobs/[id]` | Delete job |
| GET | `/api/admin/workers` | List workers |
| POST | `/api/admin/workers` | Create worker |
| GET | `/api/admin/clients` | List clients |
| POST | `/api/admin/clients` | Create client |
| GET | `/api/admin/templates` | List job templates |
| POST | `/api/admin/templates` | Create job template |
| GET | `/api/admin/templates/[id]` | Get template detail |
| PUT | `/api/admin/templates/[id]` | Update template |
| DELETE | `/api/admin/templates/[id]` | Delete template |
| GET | `/api/admin/recurring` | List recurring schedules |
| POST | `/api/admin/recurring` | Create recurring schedule |
| GET | `/api/admin/notifications` | List all notifications + unread count |
| PATCH | `/api/admin/notifications` | Mark read / clear read notifications |
| DELETE | `/api/admin/notifications` | Delete single notification |

#### Field APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/[id]` | Get job detail |
| GET | `/api/jobs/[id]/location` | Get job GPS location |
| POST | `/api/jobs/[id]/checkin` | Worker check-in + notify admin |
| PATCH | `/api/jobs/[id]/checklist` | Toggle checklist item |
| POST | `/api/jobs/[id]/photos` | Upload area photo |
| POST | `/api/jobs/[id]/sign` | Submit signature → COMPLETED + notify admin |
| GET | `/api/jobs/[id]/report` | Get/generate report |
| POST | `/api/jobs/[id]/send-email` | Email PDF + notify admin |

### External Services

| Service | Purpose | Config |
|---------|---------|--------|
| **Resend** | Email PDF reports | `RESEND_API_KEY` |
| **Fonnte** | WhatsApp notifications (worker & admin) | `FONNTE_TOKEN` |
| **Supabase** | Photo/signature storage | `SUPABASE_*` |
| **NextAuth** | Authentication | `AUTH_SECRET`, `NEXTAUTH_URL` |

---

## ⏰ Cron Job Setup

The cron endpoint auto-generates jobs from recurring schedules daily.

### Cron Endpoint

```
POST /api/cron/create-jobs
Authorization: Bearer <CRON_SECRET>
```

### curl Examples

**Local testing:**
```bash
# Without auth (if CRON_SECRET not set)
curl -X POST http://localhost:3000/api/cron/create-jobs

# With auth (if CRON_SECRET is set)
curl -X POST http://localhost:3000/api/cron/create-jobs \
  -H "Authorization: Bearer aa8f34d83574ab2a096a1186901dc60d5fa0c748621268ee01020b3cef2445a7"
```

**Production:**
```bash
curl -X POST https://your-domain.com/api/cron/create-jobs \
  -H "Authorization: Bearer aa8f34d83574ab2a096a1186901dc60d5fa0c748621268ee01020b3cef2445a7"
```

**Response example:**
```json
{
  "success": true,
  "date": "2026-07-07",
  "summary": {
    "total": 5,
    "created": 2,
    "skipped": 3,
    "errors": 0
  },
  "results": [
    { "scheduleId": "...", "title": "Pembersihan Rutin", "status": "created", "jobNumber": "LAP-20260707-001" },
    { "scheduleId": "...", "title": "Deep Cleaning", "status": "skipped", "reason": "Job already exists for today" }
  ]
}
```

### cron-job.org Setup (Free)

1. Go to [cron-job.org](https://cron-job.org) and create account
2. Click **"Create Cronjob"**
3. Configure:
   - **Name:** `Create Daily Jobs`
   - **URL:** `https://your-domain.com/api/cron/create-jobs`
   - **Schedule:** `0 0 * * *` (daily at midnight)
   - **Timezone:** Asia/Jakarta (UTC+7)
4. **Request headers:**
   ```
   Authorization: Bearer aa8f34d83574ab2a096a1186901dc60d5fa0c748621268ee01020b3cef2445a7
   ```
5. Save

---

### Admin Notifications (via Fonnte WhatsApp + In-App)

| Event | Notification |
|-------|-------------|
| Worker check-in | 🔔 Worker {name} check-in untuk {job} |
| Client signed | ✍️ {name} ({title}) menandatangani {job} |
| Job completed | ✅ Job {title} selesai |
| Job overdue | ⚠️ Job {title} belum check-in |
| Report sent | 📧 PDF {job} dikirim ke {email} |

Notifications are sent via WhatsApp and stored in-app for the Notifications page.

---

## 📂 Directory Structure

```
06-proof-of-work/web/
├── app/
│   ├── admin/
│   │   ├── dashboard/page.tsx      # Admin dashboard
│   │   ├── jobs/
│   │   │   ├── page.tsx           # Job list
│   │   │   ├── new/page.tsx        # Create job
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Job detail server component
│   │   │       └── JobDetailClient.tsx  # Job detail client component
│   │   ├── templates/page.tsx      # Job templates (UI + CRUD)
│   │   ├── recurring/page.tsx      # Recurring schedules (UI + CRUD)
│   │   ├── notifications/page.tsx   # Admin notifications list
│   │   ├── workers/               # Worker management
│   │   └── clients/               # Client management
│   ├── api/
│   │   ├── admin/
│   │   │   ├── templates/          # Templates CRUD API
│   │   │   ├── recurring/          # Recurring schedules API
│   │   │   ├── notifications/      # Notifications API
│   │   │   ├── jobs/               # Jobs CRUD
│   │   │   ├── workers/            # Workers CRUD
│   │   │   └── clients/            # Clients CRUD
│   │   └── jobs/                   # Field job APIs
│   │       └── [id]/               # checkin, sign, send-email, etc.
│   ├── supervisor/                 # Supervisor layout + dashboard
│   ├── field/                      # Field worker mobile pages
│   ├── report/[id]/page.tsx       # PDF report viewer
│   └── login/page.tsx             # Login page
├── components/
│   ├── ConfirmModal.tsx           # Confirmation dialog
│   ├── StatusBadge.tsx
│   ├── Toast.tsx
│   ├── Breadcrumb.tsx
│   ├── EmptyState.tsx
│   ├── Skeleton.tsx
│   ├── JobsFilter.tsx
│   └── BottomNav.tsx
├── lib/
│   ├── auth.ts                    # NextAuth config
│   ├── prisma.ts                 # Prisma client
│   ├── email.ts                   # Resend email
│   ├── wa.ts                      # Fonnte WhatsApp
│   ├── notifications.ts            # Admin notifications
│   ├── storage.ts                 # Supabase storage
│   ├── geofence.ts               # GPS distance calculation
│   └── serialize.ts              # Decimal/Date serialization
└── prisma/
    ├── schema.prisma              # Database schema
    └── seed.ts                   # Demo data
```

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Database setup
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed demo data

# Development
npm run dev            # Start dev server

# Production
npm run build           # Build for production
npm start              # Start production server
```

---

## 📝 Environment Variables

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Email (Resend)
RESEND_API_KEY=re_...

# WhatsApp (Fonnte)
FONNTE_TOKEN=xjXKrze8qZZwypOj4OlurLwtq9W9FgQwDHPPxa828b4fLFz4YxGyE0c=
```

---

## 🎯 Demo Data Available

| Type | Count | Details |
|------|-------|---------|
| Clients | 5 | PT Maju Bersama, Hotel Bintang Timur, dll |
| Workers | 6 | 1 admin, 1 supervisor, 4 field |
| Jobs | 5 | COMPLETED, IN_PROGRESS, ASSIGNED, DRAFT, INVOICED |

**COMPLETED job** has PDF + signature ready for demo!

---

*Last Updated: 2026-07-02*
*Maintained by: Claude Code (Application Engineer)*
