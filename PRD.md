# PRD — Proof of Work Generator
**Segmen:** 06 · Jasa  
**Target:** Cleaning Service B2B Korporat, Event Organizer Skala Menengah-Besar  
**Status:** MVP Demo · Pytagotech 2026

---

## 1. Problem Statement

Bisnis jasa (cleaning service B2B, EO) tagihan sering dispute atau molor karena tidak ada dokumentasi solid untuk membuktikan pekerjaan sudah selesai sesuai kesepakatan. Tim lapangan tidak terpantau — supervisor tidak bisa verifikasi kehadiran dan kualitas dari kantor. Di EO, koordinasi ratusan vendor via WhatsApp adalah resep chaos. Invoice tidak bisa diproses karena paperwork tidak lengkap atau tidak terorganisir.

**Root cause:** Tidak ada sistem digital yang mengikat check-in, dokumentasi kerja, dan persetujuan klien dalam satu alur terpadu yang menghasilkan laporan otomatis.

---

## 2. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Dispute tagihan dieliminasi | 0 invoice yang ditolak karena "tidak ada bukti" dalam 3 bulan |
| Invoice lebih cepat | Dari submit invoice >7 hari setelah kerja → <24 jam |
| Supervisor bisa monitor remote | Supervisor bisa verifikasi 100% tim hadir & kerja tanpa site visit |
| Laporan kerja otomatis | 0 menit waktu admin untuk buat laporan per kunjungan |

---

## 3. User Personas

### 3A. Tim Lapangan (Field Worker)
- Tugasnya: kerjakan tugas di lokasi klien
- Pain: tidak ada cara mudah lapor kerja selesai
- Tech level: rendah — hanya pakai HP Android, familiar WA
- Need: interface sederhana, tidak perlu training panjang

### 3B. Supervisor
- Tugasnya: pastikan tim lapangan kerja sesuai standar
- Pain: harus datang ke lokasi untuk verifikasi — tidak efisien
- Need: monitor real-time lokasi dan progress tim dari HP

### 3C. Admin / Back Office
- Tugasnya: generate laporan, kirim invoice ke klien
- Pain: harus kumpulkan foto dari berbagai WA group, susun manual
- Need: laporan otomatis siap lampir ke invoice

### 3D. Klien Korporat
- Tugasnya: approve pekerjaan, proses pembayaran
- Pain: tidak ada dokumen resmi sebagai basis approval
- Need: laporan yang terpercaya, ada tanda tangan digital

---

## 4. Scope MVP

### 4.1 In Scope
**Field Worker (via mobile web/PWA):**
- Check-in GPS (catat waktu + koordinat)
- Upload foto before/after per area
- Checklist tugas digital per area (konfirmasi satu per satu)
- Tanda tangan digital klien (di layar HP atau tablet yang dibawa)
- Check-out (waktu selesai tercatat)

**Supervisor (via web):**
- Real-time dashboard: siapa sedang check-in di mana
- Progress checklist per tim
- Notifikasi jika ada tim yang belum check-in pada jam yang seharusnya

**Admin:**
- Auto-generate laporan kerja PDF setelah TTD klien
- Daftar semua pekerjaan dengan status
- Kirim laporan ke email klien

### 4.2 Out of Scope
- Penjadwalan shift / roster
- Penggajian
- Inventaris peralatan
- Vendor management EO (fase berikutnya)
- Tracking GPS real-time berkelanjutan (privacy concern)

---

## 5. Feature Specification

### F-01 · Job Assignment
**Admin buat job:**
- Nama job / deskripsi pekerjaan
- Klien (dari master)
- Lokasi: alamat + pilih area/zona yang harus dikerjakan
- Tim yang ditugaskan (satu atau beberapa field worker)
- Tanggal & waktu jadwal kerja
- Checklist tugas per area (bisa dari template atau custom)
- Catatan khusus

**Field worker terima notifikasi:** WA atau push notification: "Ada penugasan baru: [nama job] - [tanggal]"

---

### F-02 · Check-in GPS
**Flow field worker:**
1. Buka app → lihat daftar job hari ini
2. Tap "Mulai Kerja" pada job yang sesuai
3. Sistem request izin lokasi
4. Jika koordinat dalam radius 200m dari lokasi klien → check-in berhasil
5. Jika di luar radius → warning, bisa override dengan alasan (log tersimpan)
6. Timestamp + koordinat tersimpan di server

**Tampilan supervisor:** peta sederhana dengan pin lokasi setiap field worker yang aktif

---

### F-03 · Foto Before/After
**Per area kerja:**
- Area ditentukan admin saat buat job (misal: Lobby, Toilet L1, Toilet L2, Ruang Meeting)
- Field worker pilih area → ambil foto "Sebelum"
- Kerjakan → ambil foto "Sesudah"
- Foto ter-upload otomatis dengan metadata: area, timestamp, job ID

**Validasi:**
- Foto harus diambil dari kamera langsung (tidak bisa upload dari gallery — ini intent, bisa bypass secara teknis tapi cukup untuk demo)
- Minimum 1 foto before + 1 foto after per area

---

### F-04 · Checklist Digital
**Per area, ada daftar tugas:**
- Contoh: "Lantai disapu ✓", "Lantai dipel ✓", "Kaca dibersihkan ✓", "Sampah dibuang ✓"
- Field worker centang satu per satu
- Checklist tidak bisa semua di-centang sekaligus (prevent gaming — centang satu per satu)
- Progress bar per area muncul untuk supervisor

---

### F-05 · Tanda Tangan Digital Klien
**Setelah semua checklist dan foto selesai:**
1. Field worker panggil PIC klien
2. Buka halaman review: ringkasan foto + checklist per area
3. PIC klien review → tanda tangan di layar (signature pad)
4. Input nama PIC + jabatan
5. Simpan → laporan otomatis di-generate

**Jika klien tidak ada / tidak bisa TTD:**
- Field worker bisa submit tanpa TTD dengan alasan (log tersimpan)
- Laporan tetap di-generate dengan catatan "Pending Client Sign"

---

### F-06 · Auto-generate Laporan PDF
**Konten laporan:**
- Header: logo perusahaan + logo klien (opsional), nomor laporan, tanggal
- Info pekerjaan: nama job, klien, lokasi, tim, tanggal, jam masuk-keluar
- Ringkasan per area: checklist (semua ✓) + foto before/after side-by-side
- GPS check-in: koordinat + waktu
- Tanda tangan digital PIC klien + nama + jabatan
- Footer: "Dokumen ini digenerate otomatis oleh sistem"

**Format:** PDF, ukuran A4
**Akses:** Download dari admin panel + link kirim ke email klien

---

## 6. Data Model (Simplified)

```
Client (klien)
  id, name, contactName, contactPhone, contactEmail, address

Job (pekerjaan)
  id, clientId, title, description
  location: {address, lat, lng, radius}
  scheduledDate, scheduledTime
  status: draft|assigned|in_progress|completed|invoiced
  assignedWorkers: [workerId]
  areas: [Area]

Area (zona kerja dalam satu job)
  id, jobId, name
  checklistItems: [{id, label, isDone, doneAt, doneBy}]
  photos: [Photo]

Photo
  id, jobId, areaId
  type: before|after
  url, takenAt, uploadedBy

WorkSession (satu field worker dalam satu job)
  id, jobId, workerId
  checkInAt, checkInLat, checkInLng, checkInNote
  checkOutAt, checkOutLat, checkOutLng
  isOverrideLocation (boolean)

ClientSignature
  id, jobId
  signatureDataUrl (base64)
  signerName, signerTitle
  signedAt
  isPendingSign (boolean)

Report
  id, jobId
  pdfUrl
  generatedAt, sentToClientAt
```

---

## 7. Demo Script

**Target:** Owner cleaning service B2B atau EO

1. **Opening hook:** "Terakhir kali klien dispute tagihan kalian, dokumen apa yang kalian kasih sebagai bukti kerja?"
2. Tunjukkan job yang sudah dibuat oleh admin
3. Dari HP (field worker): check-in GPS → koordinat tercatat
4. Upload foto before (simulasi: foto ruangan sebelum dibersihkan)
5. Centang checklist satu per satu (jangan sekaligus — ini yang buat klien percaya)
6. Upload foto after
7. Tanda tangan digital (minta audience volunteer untuk TTD di layar)
8. Klik "Selesai & Buat Laporan"
9. Tunjukkan PDF yang ter-generate: foto, GPS, checklist, TTD — semua ada
10. Kirim PDF ke email
11. **Close:** "Invoice kalian sekarang punya lampiran yang tidak bisa didispute."

---

## 8. Timeline Estimasi

| Fase | Durasi |
|------|--------|
| Setup + job & client management | 3 hari |
| Check-in GPS + mobile web | 4 hari |
| Foto before/after upload | 3 hari |
| Checklist digital | 2 hari |
| Signature pad + client sign | 2 hari |
| PDF auto-generate | 4 hari |
| Supervisor dashboard | 2 hari |
| Polish + demo | 2 hari |
| **Total** | **~22 hari kerja** |
