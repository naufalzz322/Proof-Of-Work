# Changelog — Proof of Work Generator

All notable changes to this project will be documented in this file.

---

## [Unreleased] — 2026-07-08

### Added
- **Simplified User Guides** — Quick-start guides for end users (2-3 min read):
  - `docs/SIMPLE_USER_GUIDE.md` — Field Worker quick guide
  - `docs/SIMPLE_ADMIN_GUIDE.md` — Admin quick guide
  - `docs/SIMPLE_SUPERVISOR_GUIDE.md` — Supervisor quick guide

### Changed
- **`docs/README.md`** — Updated to show quick guides first, detailed guides second

---

## [2026-07-07]

### Added
- **User Documentation** — Complete user guide package:
  - `docs/USER_GUIDE.md` - Main guide with WhatsApp setup
  - `docs/ADMIN_GUIDE.md` - Admin role guide
  - `docs/SUPERVISOR_GUIDE.md` - Supervisor role guide
  - `docs/FIELD_WORKER_GUIDE.md` - Field worker role guide
  - `docs/README.md` - Documentation index

- **GitHub-Ready Setup** — Project configured for public repository:
  - Comprehensive `.gitignore` (secrets, dependencies, IDE files)
  - `.env.example` template with all variables documented
  - Clear setup instructions

- **Mobile Responsive Settings Pages** — All settings pages now responsive:
  - Mobile: `p-4`, smaller avatars, tighter spacing
  - Tablet/Desktop: `sm:p-6`, larger avatars, comfortable spacing
  - Responsive typography (smaller headings on mobile)
  - Truncation for long names

- **Mobile Responsive Supervisor Dashboard** — Dashboard now responsive:
  - Mobile: 2-column stats grid, single column layout
  - Tablet: 3-column worker grid
  - Desktop: Full layout with sidebar
  - Responsive padding and spacing throughout

- **Low Progress Jobs Section** — Dedicated expandable section showing jobs with <50% progress:
  - Click to expand from Alert Banner or Progress Rendah stat card
  - Shows job title, client, time elapsed, progress percentage
  - Clickable links to job detail
  - Close button to hide

### Changed
- **Field Settings Page** — Updated UI consistency with better styling:
  - Light theme (matching admin/supervisor)
  - Cleaner card-based layout
  - Consistent input styling with `border-slate-300`
  - Consistent `focus:ring-amber-600` styling
  - Professional typography and color hierarchy
  - **Added back button** for easy navigation back to previous page

- **Alert Banner** — Now shows: low progress jobs, late workers, workers without check-in
- **Overdue Stat Card → Progress Rendah** — Shows jobs with low progress instead of overdue
- **Worker Status Grid** — Workers with low progress jobs now have amber ring indicator
- **Job Hari Ini List** — Low progress jobs have amber background highlight
- **Removed "Overdue" concept** — Replaced with "Progress" monitoring
  - Jobs are now monitored by their actual progress percentage
  - No more hard-coded grace period that doesn't fit all job durations

### Removed
- Overdue badge from job cards
- Red overdue indicators from worker cards
- Red-themed alerts (now amber for warnings)

---

## [2026-07-07]

### Session 54
- Restored Settings Pages (Admin, Supervisor, Field)
- UI consistency fixed across themes
- Navigation cleanup

### Session 53
- Added Profile Settings Page with password change

### Session 52
- Email PDF Attachment via Resend
- Production mode (removed test targets)

### Session 51
- Fixed Sidebar position (sticky)
- Per-user notification read status (seenBy array)

### Session 50
- Per-user notification read status implementation

### Session 49
- Supervisor Job Detail redesign (matching admin)

### Session 48
- Supervisor Dashboard job filter (ASSIGNED, IN_PROGRESS, COMPLETED only)
- Activity feed with time-based job grouping
- Time periods: Pagi (06-12), Siang (12-17), Sore (17-21), Malam (21-06)

### Session 47
- Clean up report files (web & PDF)

### Session 46
- PhotoComparison UI improvements

### Session 45
- PhotoComparison slider fix & relocation to admin/supervisor

### Session 43-44
- Late check-in & out-of-range override features
- Photo upload flow redesign with compression

### Session 41
- Email template redesign (removed emojis, professional styling)

### Session 39-40
- Service Worker & offline features
- Field worker advanced features (push notifications, offline photo queue, job timer)

### Session 37-38
- Field Worker UI/UX enhancements
- Bug fixes

### Session 35-36
- Recurring page UI/UX enhancements
- Bug fixes (405 error, empty jobs list, timezone fixes)

---

## [2026-07-05]

### Session 34
- Supervisor Dashboard UI/UX
  - Real-time activity feed
  - Time-based job grouping
  - Worker status grid
  - Alert banner
  - View mode toggle

---

## [2026-07-04]

### Session 33
- Supervisor UI redesign
  - Notifications page improvements
  - Jobs page redesign
  - Sidebar fixes

### Session 32
- Supervisor capabilities (view jobs, edit schedule, send PDF)

### Session 31
- Job assigned notification

### Session 30
- Fonnte WhatsApp API fix

### Session 29
- Worker WA notification fix

### Session 26-28
- UI fixes and reusable Modal component
- Edit Job Modal location integration

### Session 23-25
- More available workers in seed

### Session 20-22
- Notification badge in sidebar
- Notification page UI/UX improvements
- Cron endpoint for auto-job creation

---

## [2026-07-03]

### Session 17-19
- Collapsible sidebar
- Report page slug fix
- Job slug = LAP-YYYYMMDD-NNN format

### Session 11-16
- Slug-based URL routing for all pages
- Field worker slug migration
- Database sync fix

---

## [2026-07-02]

### Session 8-10
- Comprehensive demo data seed
- UI improvements
- Missing CRUD implementation

### Session 5-7
- Templates, Recurring, Notifications pages
- Job Templates & Recurring Schedules features

---

## [2026-07-01]

### Session 3-4
- Email PDF integration
- Bug fixes and login redirect

### Session 1-2
- Initial setup and code review

---

## Features Status

| Feature | Status |
|---------|--------|
| F-01: Job Assignment | ✅ |
| F-02: Check-in GPS | ✅ |
| F-03: Foto Before/After | ✅ |
| F-04: Checklist Digital | ✅ |
| F-05: Tanda Tangan Digital | ✅ |
| F-06: Auto-generate PDF | ✅ |
| F-07: Email PDF (Resend) | ✅ |
| F-08: Job Templates | ✅ |
| F-09: Recurring Schedule | ✅ |
| F-10: Admin Notifications (Fonnte) | ✅ |
