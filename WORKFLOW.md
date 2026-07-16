# Complete Job Workflow — Proof of Work Generator

## Overview
This document describes the end-to-end workflow for completing a single job from creation to report delivery.

---

## 👤 ADMIN Workflow

### Step 1: Login
```
URL: http://localhost:3000/login
Credentials:
  - Admin: admin@pytagotech.com / admin123
  - Supervisor: supervisor@pytagotech.com / admin123
  - Field: budi@field.com / field123
```
- Admin logs in → Redirected to `/admin/dashboard`

### Step 2: Create New Job
```
URL: /admin/jobs
```
1. Click **"Job Baru"** button (opens modal)
2. Fill job details:
   - **Judul**: Job title (e.g., "Pembersihan Kantor Lt. 3")
   - **Klien**: Select from dropdown (e.g., "PT Maju Bersama")
   - **Lokasi**: Address + GPS coordinates
   - **Tanggal**: Scheduled date
   - **Waktu**: Scheduled time
   - **Catatan**: Optional notes
3. **(Optional) Select Template**: Choose pre-made template to auto-fill areas
4. Add Areas:
   - Click **"+ Tambah Area"**
   - Enter area name (e.g., "Lobby", "Toilet", "Ruang Meeting")
   - Add checklist items per area
5. Assign Workers:
   - Select field workers from dropdown
   - Multiple workers can be assigned
6. Click **"Simpan Job"**
7. System sends **WhatsApp notification** to assigned workers

### Step 3: Monitor Job Progress
```
URL: /admin/dashboard
```
- View dashboard stats:
  - Jobs today
  - In-progress jobs
  - Active workers
  - Pending reports

### Step 4: Check Notifications
```
URL: /admin/notifications
```
- View notifications for:
  - Worker check-in 🔔
  - Client signed ✍️
  - Job completed ✅
  - Report sent 📧
- Mark as read or delete

### Step 5: Download & Send PDF Report
```
URL: /admin/jobs/[jobId]
```
1. Wait for job status to become **"COMPLETED"**
2. Click **"Download PDF"** to view report
3. Click **"Kirim ke Email"** to send report to client
4. Fill email form:
   - Email Penerima (auto-filled from client contact)
   - Nama Penerima (auto-filled from client contact)
5. Click **"Kirim"**
6. System sends PDF to client email + notification to admin

### Step 6: (Optional) Mark as Invoiced
```
URL: /admin/jobs/[jobId]
```
- Edit job status → Change to **"INVOICED"**

---

## 👤 SUPERVISOR Workflow

### Step 1: Login
```
URL: http://localhost:3000/login
Credentials: supervisor@pytagotech.com / admin123
```
- Supervisor logs in → Redirected to `/supervisor/dashboard`

### Step 2: View Dashboard
```
URL: /supervisor/dashboard
```
- View today's jobs
- See checked-in workers
- Track progress percentages

### Step 3: Receive Notifications
- Supervisor receives **WhatsApp notifications** via Fonnte:
  - When worker checks in
  - When client signs
  - When job is completed
  - When report is sent

### Step 4: Monitor Active Workers
```
URL: /supervisor/dashboard
```
- View real-time status of field workers
- See progress % per job
- Click job to see details

### Step 5: Access Reports
```
URL: /supervisor/dashboard
```
- Click completed job link
- View PDF report (read-only)

---

## 👤 FIELD WORKER Workflow

### Step 1: Login
```
URL: http://localhost:3000/login
Credentials: budi@field.com / field123
```
- Field worker logs in → Redirected to `/field/jobs`

### Step 2: View Assigned Jobs
```
URL: /field/jobs
```
- **Job Hari Ini**: Jobs scheduled for today
- **Job Besok**: Jobs scheduled for tomorrow
- **Selesai**: Completed jobs

### Step 3: Start Job (Check-in)
```
URL: /field/jobs/[jobId]/checkin
```
1. Click **"Mulai Kerja"** on job card
2. System checks GPS location
3. If within **200m radius** of job location:
   - Click **"Konfirmasi Check-in"**
   - Check-in time recorded
4. If outside radius:
   - Provide reason for override
   - Admin/supervisor will be notified
5. Worker receives **WhatsApp confirmation**

### Step 4: Work on Areas
```
URL: /field/jobs/[jobId]/areas
```
1. See list of assigned areas
2. Click area to work on (e.g., "Lobby Lt. 3")
3. Per area, complete these steps:

#### 4a. Take BEFORE Photo
```
URL: /field/jobs/[jobId]/areas/[areaId]
```
1. Click **"Ambil Foto SEBELUM"**
2. Camera opens
3. Take photo
4. Photo uploaded

#### 4b. Complete Checklist
```
URL: /field/jobs/[jobId]/areas/[areaId]
```
1. See checklist items for area
2. Tap each item to mark as **done/undone**
3. Progress tracked

#### 4c. Take AFTER Photo
```
URL: /field/jobs/[jobId]/areas/[areaId]
```
1. Only available after ALL checklist items are done
2. Click **"Ambil Foto SESUDAH"**
3. Take photo
4. Photo uploaded

#### 4d. Move to Next Area
1. Go back to areas list
2. Repeat for next area

### Step 5: Request Client Signature
```
URL: /field/jobs/[jobId]/sign
```
1. Only available after ALL areas are complete
2. Click **"Minta Tanda Tangan"**
3. Enter **Nama PIC** (required)
4. Enter **Jabatan** (optional)
5. Client signs on signature pad
6. Click **"Simpan & Buat Laporan"**

### Step 6: Job Completed
```
URL: /field/jobs/[jobId]/done
```
1. Job status changes to **"COMPLETED"**
2. PDF report auto-generated
3. **WhatsApp notification** sent to admin/supervisor
4. Client signed notification sent

### Step 7: Return to Job List
```
URL: /field/jobs
```
- Job moves to **"Selesai"** tab
- Job card shows **"✓ Selesai"** badge

---

## 🔄 Full Sequence Diagram

```
ADMIN                    SYSTEM                    WORKER                  CLIENT
  │                         │                         │                        │
  │ 1. Create Job           │                         │                        │
  │ ───────────────────────>│                         │                        │
  │                         │ 2. Send WhatsApp        │                        │
  │                         │ ────────────────────────>│                        │
  │                         │                         │                        │
  │                         │                    3. Check-in (GPS)           │
  │                         │                         │                        │
  │                         │ 4. Notify check-in ────>│                        │
  │                         │                         │                        │
  │                         │                    5. Work on areas             │
  │                         │                         │ (BEFORE photo)         │
  │                         │                         │ (Checklist)            │
  │                         │                         │ (AFTER photo)          │
  │                         │                         │                        │
  │                         │                    6. Client signature           │
  │                         │                         │ ──────────────────────> │
  │                         │                         │                        │
  │                         │ 7. Notify signed ──────>│                        │
  │                         │ 8. Job COMPLETED        │                        │
  │                         │ 9. Generate PDF          │                        │
  │                         │                         │                        │
  │ 10. Download PDF        │                         │                        │
  │ <───────────────────────────────────────────────────────────────────────────│
  │                         │                         │                        │
  │ 11. Send Email          │                         │                        │
  │ ────────────────────────────────────────────────────────────────────────────>│
  │                         │                         │                        │
  │ 12. Notify sent ───────>│                         │                        │
  │                         │                         │                        │
```

---

## 📱 Screens Summary

### Admin Screens
| Screen | URL | Purpose |
|--------|-----|---------|
| Dashboard | `/admin/dashboard` | Overview stats |
| Jobs List | `/admin/jobs` | View all jobs |
| Create Job | `/admin/jobs` (modal) | Create new job |
| Job Detail | `/admin/jobs/[id]` | View/edit job, download PDF |
| Workers | `/admin/workers` | Manage workers |
| Clients | `/admin/clients` | Manage clients |
| Templates | `/admin/templates` | Manage job templates |
| Recurring | `/admin/recurring` | Auto-schedule jobs |
| Notifications | `/admin/notifications` | View notifications |
| Reports | `/admin/reports` | View all reports |

### Supervisor Screens
| Screen | URL | Purpose |
|--------|-----|---------|
| Dashboard | `/supervisor/dashboard` | Monitor team & jobs |

### Field Worker Screens
| Screen | URL | Purpose |
|--------|-----|---------|
| Job List | `/field/jobs` | View assigned jobs |
| Check-in | `/field/jobs/[id]/checkin` | GPS check-in |
| Areas List | `/field/jobs/[id]/areas` | View areas |
| Area Detail | `/field/jobs/[id]/areas/[areaId]` | Work on area |
| Signature | `/field/jobs/[id]/sign` | Client sign |
| Done | `/field/jobs/[id]/done` | Completion confirmation |

---

## 📋 Status Flow

```
DRAFT → ASSIGNED → IN_PROGRESS → COMPLETED → INVOICED
  │         │            │            │           │
  │         │            │            │           └── (Final state)
  │         │            │            └── After client signature
  │         │            └── After first check-in
  │         └── After assigning workers
  └── Initial state
```

---

## 🔔 Notification Events

| Event | Who Notified | Channel |
|-------|-------------|---------|
| Job created | Assigned workers | WhatsApp |
| Worker check-in | Admin, Supervisor | WhatsApp |
| Client signed | Admin, Supervisor | WhatsApp |
| Job completed | Admin, Supervisor | WhatsApp |
| Report sent | Admin, Supervisor | WhatsApp |
| All events | Admin | In-app (Notifications page) |

---

## 🧪 Testing the Full Flow

### Demo Credentials
```
Admin:       admin@pytagotech.com / admin123
Supervisor:  supervisor@pytagotech.com / admin123
Field:       budi@field.com / field123
```

### Demo Data
```
Clients: 5 (PT Maju Bersama, Hotel Bintang Timur, dll)
Workers: 6 (1 admin, 1 supervisor, 4 field)
Jobs: 5 (COMPLETED, IN_PROGRESS, ASSIGNED, DRAFT, INVOICED)
```

### Quick Test
1. Login as **admin** → Create new job
2. Assign **budi@field.com** as worker
3. Login as **budi** → Check-in → Complete areas → Sign
4. Login as **admin** → Download PDF → Send email
5. Check **notifications** page for activity log

---

*Last Updated: 2026-07-02*
