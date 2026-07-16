# AGENT.md — Proof of Work Generator
**Segmen 06 · Jasa**

---

## 1. Stack

```
Framework:   Next.js 14 (App Router) — PWA-capable
Database:    PostgreSQL via Supabase
ORM:         Prisma
Auth:        NextAuth (admin + supervisor + field worker — credential-based)
Storage:     Supabase Storage (foto before/after, signature images)
PDF:         Puppeteer (render HTML ke PDF dengan layout akurat)
             Alternatif: jsPDF + autoTable (lebih lightweight)
Styling:     Tailwind CSS v3
WA Notif:   Fonnte API
Geolocation: Browser Geolocation API (native)
Signature:   signature_pad (npm)
Deploy:      Vercel + Supabase
```

---

## 2. Folder Structure

```
/app
  /(field)                        → mobile field worker (auth: FIELD role)
    /jobs/page.tsx                → daftar job hari ini
    /jobs/[id]/page.tsx           → detail job
    /jobs/[id]/checkin/page.tsx   → GPS check-in
    /jobs/[id]/areas/page.tsx     → list area
    /jobs/[id]/areas/[areaId]     → checklist + foto satu area
    /jobs/[id]/sign/page.tsx      → TTD klien
    /jobs/[id]/done/page.tsx      → konfirmasi selesai

  /(admin)                        → admin panel (auth: ADMIN role)
    /dashboard
    /jobs                         → CRUD job + assignment
    /clients                      → CRUD klien
    /workers                      → CRUD field worker
    /reports                      → daftar laporan + download PDF

  /(supervisor)                   → supervisor panel (auth: SUPERVISOR role)
    /dashboard                    → real-time monitoring tim

  /api
    /jobs                         → CRUD job
    /jobs/[id]/checkin            → POST check-in GPS
    /jobs/[id]/checkout           → POST check-out
    /jobs/[id]/checklist          → PATCH update checklist item
    /jobs/[id]/photos             → POST upload foto
    /jobs/[id]/sign               → POST simpan TTD
    /jobs/[id]/report             → POST generate PDF laporan
    /upload                       → Supabase Storage upload handler

/lib
  /pdf.ts                         → Puppeteer PDF generator
  /geofence.ts                    → haversine distance check
  /wa.ts                          → Fonnte WA notification

/components
  /(field)
    /JobCard.tsx
    /CheckinMap.tsx
    /ChecklistArea.tsx
    /PhotoCapture.tsx
    /SignaturePad.tsx
  /(admin)
    /JobForm.tsx
    /AreaBuilder.tsx              → drag-and-drop area + checklist setup
    /WorkerMap.tsx                → peta supervisor
```

---

## 3. Prisma Schema

```prisma
model Client {
  id           String @id @default(cuid())
  name         String
  contactName  String
  contactPhone String
  contactEmail String?
  address      String
  logoUrl      String?
  jobs         Job[]
}

model Worker {
  id           String @id @default(cuid())
  name         String
  email        String @unique
  passwordHash String
  phone        String
  role         WorkerRole @default(FIELD)
  sessions     WorkSession[]
  createdAt    DateTime @default(now())
}

enum WorkerRole { FIELD SUPERVISOR ADMIN }

model Job {
  id             String    @id @default(cuid())
  jobNumber      String    @unique
  clientId       String
  client         Client    @relation(fields: [clientId], references: [id])
  title          String
  description    String?
  locationAddress String
  locationLat    Decimal
  locationLng    Decimal
  locationRadius Int       @default(200) // meter
  scheduledDate  DateTime
  scheduledTime  String
  status         JobStatus @default(DRAFT)
  areas          JobArea[]
  workers        WorkSession[]
  signature      ClientSignature?
  report         JobReport?
  createdAt      DateTime  @default(now())
}

enum JobStatus { DRAFT ASSIGNED IN_PROGRESS COMPLETED INVOICED }

model JobArea {
  id        String         @id @default(cuid())
  jobId     String
  job       Job            @relation(fields: [jobId], references: [id])
  name      String
  sortOrder Int            @default(0)
  items     ChecklistItem[]
  photos    AreaPhoto[]
}

model ChecklistItem {
  id        String   @id @default(cuid())
  areaId    String
  area      JobArea  @relation(fields: [areaId], references: [id])
  label     String
  isDone    Boolean  @default(false)
  doneAt    DateTime?
  doneBy    String?  // workerId
}

model AreaPhoto {
  id         String  @id @default(cuid())
  areaId     String
  area       JobArea @relation(fields: [areaId], references: [id])
  type       PhotoType
  url        String
  takenAt    DateTime
  uploadedBy String  // workerId
}

enum PhotoType { BEFORE AFTER }

model WorkSession {
  id                 String   @id @default(cuid())
  jobId              String
  job                Job      @relation(fields: [jobId], references: [id])
  workerId           String
  worker             Worker   @relation(fields: [workerId], references: [id])
  checkInAt          DateTime?
  checkInLat         Decimal?
  checkInLng         Decimal?
  checkInNote        String?
  isOverrideLocation Boolean  @default(false)
  checkOutAt         DateTime?
}

model ClientSignature {
  id             String   @id @default(cuid())
  jobId          String   @unique
  job            Job      @relation(fields: [jobId], references: [id])
  signatureUrl   String   // Supabase Storage URL (PNG)
  signerName     String
  signerTitle    String
  signedAt       DateTime
  isPendingSign  Boolean  @default(false)
  pendingReason  String?
}

model JobReport {
  id          String   @id @default(cuid())
  jobId       String   @unique
  job         Job      @relation(fields: [jobId], references: [id])
  pdfUrl      String
  generatedAt DateTime @default(now())
  sentAt      DateTime?
  sentToEmail String?
}
```

---

## 4. Geofence Check

```typescript
// /lib/geofence.ts
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

// Usage di API check-in:
const distance = haversineDistance(
  userLat, userLng,
  job.locationLat, job.locationLng
);
const isWithinRadius = distance <= job.locationRadius;
```

---

## 5. PDF Generation dengan Puppeteer

```typescript
// /lib/pdf.ts
// Pendekatan: render halaman Next.js /report/[jobId] sebagai PDF
// Lebih fleksibel dari jsPDF untuk layout dengan foto

import puppeteer from 'puppeteer';

export async function generateJobReportPDF(jobId: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Render halaman report HTML (internal, dengan token auth)
  await page.goto(
    `${process.env.INTERNAL_RENDER_URL}/report/${jobId}?token=${process.env.REPORT_RENDER_TOKEN}`,
    { waitUntil: 'networkidle0' }
  );
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  
  await browser.close();
  return pdf;
}

// Note untuk Vercel: Puppeteer tidak bisa jalan di Vercel serverless
// Opsi: gunakan @sparticuz/chromium + puppeteer-core
// atau gunakan layanan external: htmlcsstoimage.com, browserless.io
// atau deploy PDF generator sebagai Railway/Render service terpisah
```

---

## 6. Photo Upload (Supabase Storage)

```typescript
// /api/upload/route.ts
// Field worker upload foto dari HP → simpan ke Supabase Storage

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const areaId = formData.get('areaId') as string;
  const type = formData.get('type') as 'before' | 'after'; // PhotoType
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `jobs/${areaId}/${type}-${Date.now()}.jpg`;
  
  const { data, error } = await supabase.storage
    .from('job-photos')
    .upload(filename, buffer, { contentType: 'image/jpeg', upsert: false });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('job-photos')
    .getPublicUrl(filename);
  
  // Simpan ke DB: AreaPhoto
  await prisma.areaPhoto.create({
    data: { areaId, type, url: publicUrl, takenAt: new Date(), uploadedBy: userId }
  });
  
  return Response.json({ url: publicUrl });
}
```

---

## 7. Seed Data untuk Demo

```typescript
// Perusahaan demo: "CV Bersih Cemerlang - Cleaning Service"
// Klien demo: "PT Maju Bersama Indonesia" (perusahaan korporat)

// Job demo yang sudah selesai (untuk tunjukkan laporan):
// Job: Cleaning Gedung Kantor Lt. 3
// Area: Lobby | Toilet Pria | Toilet Wanita | Ruang Meeting A
// Status: COMPLETED + ada signature + laporan PDF sudah ada

// Job demo yang sedang berjalan (untuk tunjukkan live):
// Job: Cleaning Area Produksi Hari Ini
// Status: IN_PROGRESS (check-in sudah, sebagian checklist selesai)

// Skenario demo:
// 1. Lihat job yang sudah ada laporannya (PDF siap download)
// 2. Demo live: job yang in-progress, lanjutkan dari HP
```

---

## 8. Development Sequence

```
Sprint 1 (hari 1-4):
  [ ] Setup + schema + auth (3 roles: admin, supervisor, field)
  [ ] Client + Worker CRUD (admin)
  [ ] Job CRUD + area builder (drag reorder checklist)

Sprint 2 (hari 5-9):
  [ ] Field worker mobile: job list + detail
  [ ] GPS check-in + geofence validation
  [ ] Checklist digital (satu per satu)

Sprint 3 (hari 10-14):
  [ ] Photo upload (before/after) — Supabase Storage
  [ ] Signature pad (react-signature-canvas)
  [ ] Simpan TTD ke Supabase Storage

Sprint 4 (hari 15-19):
  [ ] PDF generation (Puppeteer atau HTML template)
  [ ] Halaman laporan /report/[id] (HTML yang di-render jadi PDF)
  [ ] Supervisor dashboard real-time

Sprint 5 (hari 20-22):
  [ ] WA notifikasi job assignment
  [ ] Seed demo data (completed job + in-progress job)
  [ ] Demo walkthrough test
```

---

## 9. Testing Checklist

```
[ ] Check-in GPS: koordinat tersimpan akurat
[ ] Checklist: tidak bisa semua dicentang sekaligus
[ ] Foto upload dari kamera HP berhasil (test di Android)
[ ] Signature pad: bisa TTD, clear, konfirmasi → tersimpan
[ ] PDF ter-generate dengan semua konten (foto, GPS, TTD)
[ ] Foto muncul dengan baik di PDF (tidak broken link)
[ ] Supervisor: progress tim update dalam <60 detik
[ ] WA notifikasi job assignment terkirim
[ ] Download PDF dari admin berfungsi
```

---

## 10. Environment Variables

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

FONNTE_TOKEN=

# Untuk PDF generation
INTERNAL_RENDER_URL=        # base URL internal untuk Puppeteer
REPORT_RENDER_TOKEN=        # secret token untuk akses halaman report

NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_COMPANY_NAME=   # diisi nama perusahaan klien saat demo
```
