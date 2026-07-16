# 👷 Panduan Worker (Pekerja Lapangan)

Panduan ini untuk Anda yang punya peran **Worker**. Anda akan menggunakan **HP** untuk check-in, mengerjakan tugas, dan minta tanda tangan client.

---

## 📋 Daftar Isi

1. [Login](#1-login)
2. [Melihat Daftar Job](#2-melihat-daftar-job)
3. [Check-in GPS](#3-check-in-gps)
4. [Mengerjakan Tugas](#4-mengerjakan-tugas)
5. [Ambil Foto](#5-ambil-foto)
6. [Tanda Tangan Client](#6-tanda-tangan-client)
7. [Job Selesai](#7-job-selesai)

---

## 1. Login

### Buka Aplikasi

```
Buka browser HP Anda (Chrome / Safari)
Ketik: /field/jobs
Contoh: namasitus.com/field/jobs
```

### Masukkan Data Login

```
┌─────────────────────────────────────────────────────┐
│  LOGIN                                                   │
├─────────────────────────────────────────────────────┤
│                                                            │
│  📧 Email                                               │
│  ┌────────────────────────────────────────────────┐   │
│  │ budi@field.com                                   │   │
│  └────────────────────────────────────────────────┘   │
│                                                            │
│  🔐 Password                                             │
│  ┌────────────────────────────────────────────────┐   │
│  │ ••••••••                                          │   │
│  └────────────────────────────────────────────────┘   │
│                                                            │
│           [ MASUK ]                                       │
│                                                            │
└─────────────────────────────────────────────────────┘
```

> 💡 **Tips Login:**
> - Email: `budi@field.com`
> - Password: `field123`

---

## 2. Melihat Daftar Job

### Tampilan Job List

Setelah login, Anda akan lihat job yang ditugaskan hari ini:

```
┌─────────────────────────────────────────────────────┐
│  📋 JOB HARI INI                                        │
│  Senin, 15 Juli 2026                                    │
├─────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────┐   │
│  │ ⏳ BELUM CHECK-IN                                 │   │
│  │ ───────────────────────────────────────────────│   │
│  │                                                        │
│  │  Pembersihan gedung A                             │
│  │  PT Maju Bersama                                 │
│  │                                                        │
│  │  ████████████░░░░░░░░░░░░░░░░░░ 30%             │
│  │                                                        │
│  │  ⏰ 08:00  •  2/4 area  •  10 tugas           │
│  │                                                        │
│  │           [ MULAI KERJA ]                          │
│  │                                                        │
│  └──────────────────────────────────────────────┘   │
│                                                            │
└─────────────────────────────────────────────────────┘
```

### Arti Status Job

| Status | Arti | Yang Harus Dilakukan |
|--------|------|---------------------|
| **⏳ Belum Check-in** | Belum tiba di lokasi | Klik untuk check-in |
| **✓ Check-in** | Sudah tiba, sedang kerja | Klik untuk lanjut kerja |
| **✓ Selesai** | Job sudah selesai | Tidak ada aksi |

### Progress ( % )

```
Progress = pekerjaan yang sudah selesai / total pekerjaan × 100%

Contoh:
- Job punya 20 tugas
- Anda selesai 6 tugas
- Progress = 6/20 × 100% = 30%
```

---

## 3. Check-in GPS

### Apa Itu Check-in?

**Check-in** adalah absen otomatis menggunakan GPS HP Anda. Sistem akan tahu Anda benar-benar di lokasi pekerjaan.

```
┌─────────────────────────────────────────────────────┐
│  📍 CHECK-IN GPS                                        │
├─────────────────────────────────────────────────────┤
│                                                            │
│  ⚠️  PERHATIAN!                                        │
│  ─────────────────────────────────────────────────── │
│  • Anda HARUS di lokasi pekerjaan                       │
│  • GPS HP akan digunakan untuk memastikan              │
│  • Jarak maksimal dari lokasi: 200 meter              │
│                                                            │
│         [ MULAI CHECK-IN ]                              │
│                                                            │
└─────────────────────────────────────────────────────┘
```

### Langkah-Langkah Check-in

```
LANGKAH 1: Klik tombol "MULAI CHECK-IN"
           ↓
LANGKAH 2: Izinkan akses lokasi di browser
           ↓
LANGKAH 3: Tunggu GPS mendeteksi lokasi Anda
           ↓
LANGKAH 4: Lihat hasil verifikasi
           ↓
LANGKAH 5: Konfirmasi atau isi alasan
```

### ✅ Jika Berhasil (Berhasil Check-in)

```
┌─────────────────────────────────────────────────────┐
│  ✅ LOKASI TERVERIFIKASI                                   │
├─────────────────────────────────────────────────────┤
│                                                            │
│              ✅                                          │
│                                                            │
│  Lokasi Anda di titik pekerjaan!                        │
│                                                            │
│  📍 Jl. Sudirman No. 88                              │
│  ⏰ 08:05                                              │
│                                                            │
│         [ KONFIRMASI CHECK-IN ]                           │
│                                                            │
└─────────────────────────────────────────────────────┘
```

### ⚠️ Jika Terlambat

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  TERLAMBAT                                              │
├─────────────────────────────────────────────────────┤
│                                                            │
│  ⚠️  Anda terlambat 5 menit dari jadwal (08:00)          │
│                                                            │
│  Tenang saja, Anda tetap bisa check-in.                  │
│                                                            │
└─────────────────────────────────────────────────────┘
```

> 💡 **Tidak apa-apa terlambat.** Yang penting Anda tetap check-in di lokasi.

### ❌ Jika Di Luar Area (Radius > 200m)

```
┌─────────────────────────────────────────────────────┐
│  ❌ DI LUAR LOKASI                                        │
├─────────────────────────────────────────────────────┤
│                                                            │
│  Anda 350 meter dari lokasi pekerjaan.                   │
│                                                            │
│  Alasan check-in di luar area (WAJIB):                  │
│  ┌──────────────────────────────────────────────┐   │
│  │ Gerbang terkunci, masuk dari pintu belakang...    │   │
│  └──────────────────────────────────────────────┘   │
│                                                            │
│  Catatan ini akan dilihat supervisor Anda.                │
│                                                            │
│         [ CHECK-IN DENGAN ALASAN ]                       │
│                                                            │
└─────────────────────────────────────────────────────┘
```

> ⚠️ **Jika di luar area, Anda HARUS isi alasan.** Alasannya akan dilihat supervisor.

---

## 4. Mengerjakan Tugas

### Tampilan Area & Checklist

Setelah check-in, Anda akan lihat daftar area yang harus dikerjakan:

```
┌─────────────────────────────────────────────────────┐
│  📋 AREA & TUGAS                                         │
├─────────────────────────────────────────────────────┤
│                                                            │
│  PROGRESS: 30%                                          │
│  ━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░ 30%              │
│                                                            │
│  ┌────────────────────────────────────────────┐   │
│  │ ✅ Lobby Utama         4/4  ✓  [SELESAI]    │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │ ○ Toilet Pria        0/4      [KERJAKAN]   │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │ ○ Toilet Wanita     0/4      [KERJAKAN]   │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │ ○ Ruang Meeting    0/4      [KERJAKAN]   │   │
│  └────────────────────────────────────────────┘   │
│                                                            │
└─────────────────────────────────────────────────────┘
```

### Bekerja di Satu Area

Klik area untuk mulai mengerjakan:

```
┌─────────────────────────────────────────────────────┐
│  TOILET PRIA                                            │
├─────────────────────────────────────────────────────┤
│                                                            │
│  1️⃣  AMBIL FOTO "SEBELUM"                               │
│  ┌────────────────────────────────────────────┐   │
│  │        📷 AMBIL FOTO SEBELUM               │   │
│  └────────────────────────────────────────────┘   │
│                                                            │
│  2️⃣  KERJAKAN TUGAS                                    │
│  ┌────────────────────────────────────────────┐   │
│  │  ☐ Lantai dicuci                               │   │
│  │  ☐ Toilet dibersihkan                         │   │
│  │  ☐ Tissue diganti                             │   │
│  │  ☐ Sabun diisi                                │   │
│  └────────────────────────────────────────────┘   │
│                                                            │
│  3️⃣  AMBIL FOTO "SESUDAH"                              │
│  ┌────────────────────────────────────────────┐   │
│  │        📷 AMBIL FOTO SESUDAH               │   │
│  │        (Aktif setelah semua tugas selesai)    │   │
│  └────────────────────────────────────────────┘   │
│                                                            │
└─────────────────────────────────────────────────────┘
```

### Aturan Penting Checklist

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  ATURAN PENTING!                                        │
├─────────────────────────────────────────────────────┤
│                                                            │
│  ✅ Centang SATU PER SATU, bukan sekaligus!                │
│                                                            │
│  ✅ Foto "SEBELUM" HARUS diambil duluan                    │
│                                                            │
│  ✅ Semua tugas HARUS selesai sebelum foto "SESUDAH"       │
│                                                            │
│  ❌ JANGAN centang semua sekaligus!                       │
│     Ini untuk memastikan kualitas kerja Anda.              │
│                                                            │
└─────────────────────────────────────────────────────┘
```

---

## 5. Ambil Foto

### Tips Foto yang Baik

```
┌─────────────────────────────────────────────────────┐
│  📸 TIPS AMBIL FOTO YANG BAIK                               │
├─────────────────────────────────────────────────────┤
│                                                            │
│  ✅ Ambil foto yang jelas, tidak buram                     │
│  ✅ Pastikan pencahayaan cukup                            │
│  ✅ Tunjukkan hasil pekerjaan Anda                        │
│  ✅ Termasuk sudut-sudut yang sulit                       │
│                                                            │
│  📷 FOTO SEBELUM = Kondisi area SEBELUM dibersihkan       │
│  📷 FOTO SESUDAH = Kondisi area SESUDAH dibersihkan       │
│                                                            │
└─────────────────────────────────────────────────────┘
```

### Flow Foto

```
AMBIL FOTO SEBELUM
        ↓
KERJAKAN TUGAS (centang satu per satu)
        ↓
AMBIL FOTO SESUDAH
        ↓
AREA SELESAI ✅
```

---

## 6. Tanda Tangan Client

### Kapan Minta Tanda Tangan?

Setelah **SEMUA AREA SELESAI**, Anda harus minta client tanda tangan.

```
┌─────────────────────────────────────────────────────┐
│  ✍️ TANDA TANGAN CLIENT                                   │
├─────────────────────────────────────────────────────┤
│                                                            │
│  Pekerjaan selesai! Sekarang minta tanda tangan client.     │
│                                                            │
│  ──────────────────────────────────────────────────────  │
│                                                            │
│  RINGKASAN:                                              │
│  • 4 area selesai                                        │
│  • 20 foto diupload                                      │
│  • 20 tugas selesai                                       │
│                                                            │
│  ──────────────────────────────────────────────────────  │
│                                                            │
│  Minta PIC klien untuk tanda tangan di bawah ini.          │
│                                                            │
│  ┌────────────────────────────────────────────┐   │
│  │                                              │   │
│  │                                              │   │
│  │          [ AREA TANDA TANGAN ]               │   │
│  │                                              │   │
│  │                                              │   │
│  └────────────────────────────────────────────┘   │
│                                                            │
│  Nama PIC: [____________________]                         │
│  Jabatan:  [____________________]                         │
│                                                            │
│           [ BUAT LAPORAN ]                                │
│                                                            │
└─────────────────────────────────────────────────────┘
```

### Langkah-Langkah

```
LANGKAH 1: Minta client tanda tangan di area yang tersedia
           ↓
LANGKAH 2: Isi nama lengkap client
           ↓
LANGKAH 3: Isi jabatan client
           ↓
LANGKAH 4: Klik "BUAT LAPORAN"
```

### Jika Client Tidak Ada

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  CLIENT TIDAK ADA / TIDAK BISA TTD                   │
├─────────────────────────────────────────────────────┤
│                                                            │
│  Jika client tidak bisa tanda tangan:                     │
│                                                            │
│  ┌────────────────────────────────────────────┐   │
│  │ Alasan tidak bisa tanda tangan:                │   │
│  │ PIC tidak ada di lokasi                       │   │
│  └────────────────────────────────────────────┘   │
│                                                            │
│  ⚠️ Job tetap bisa diselesaikan.                       │
│  ⚠️ Laporan akan ditandai "Menunggu Tanda Tangan".       │
│                                                            │
│           [ KONFIRMASI TANPA TTD ]                        │
│                                                            │
└─────────────────────────────────────────────────────┘
```

---

## 7. Job Selesai

### Tampilan Selesai

```
┌─────────────────────────────────────────────────────┐
│  🎉 SELAMAT! PEKERJAAN SELESAI!                            │
├─────────────────────────────────────────────────────┤
│                                                            │
│              ✅                                          │
│                                                            │
│  Job telah selesai!                                      │
│                                                            │
│  ──────────────────────────────────────────────────  │
│                                                            │
│  📋 Pembersihan gedung A                               │
│  🏢 PT Maju Bersama                                    │
│  📍 Jl. Sudirman No. 88                              │
│  👤 Budi Santoso (Facility Manager)                    │
│  ✅ Tanda Tangan: OK                                  │
│                                                            │
│  ──────────────────────────────────────────────────  │
│                                                            │
│  Laporan PDF sedang diproses...                         │
│                                                            │
│           [ LIHAT LAPORAN ]                              │
│                                                            │
└─────────────────────────────────────────────────────┘
```

### Flow Selesai

```
SEMUA AREA SELESAI ✅
        ↓
CLIENT TANDA TANGAN ✅
        ↓
LAPORAN PDF DIBUAT OTOMATIS ✅
        ↓
🎉 JOB SELESAI!
```

---

## 🎯 Yang Penting Aja (Ringkasan Worker)

```
┌─────────────────────────────────────────────────────┐
│  YANG WAJIB DIINGAT UNTUK WORKER                            │
├─────────────────────────────────────────────────────┤
│                                                            │
│  📍 CHECK-IN                                              │
│  → Klik "MULAI KERJA" saat tiba di lokasi               │
│  → Pastikan GPS aktif dan izinkan akses                  │
│  → Jika di luar area (>200m), HARUS isi alasan          │
│                                                            │
│  ✅ KERJA                                                │
│  → Centang tugas SATU PER SATU (jangan sekaligus!)        │
│  → Foto SEBELUM dulu, baru kerja                        │
│  → Semua tugas selesai, baru foto SESUDAH                 │
│                                                            │
│  ✍️ TANDA TANGAN                                         │
│  → Minta client tanda tangan setelah semua area selesai    │
│  → Isi nama dan jabatan client                          │
│                                                            │
│  📄 LAPORAN                                              │
│  → PDF dibuat otomatis setelah ada tanda tangan           │
│                                                            │
└─────────────────────────────────────────────────────┘
```

---

## ❓ Pertanyaan Umum Worker

### Q: GPS tidak bisa detect lokasi?

```
1. Pastikan GPS HP aktif
2. Pastikan browser izinkan akses lokasi
3. Coba move / gojek在外面 dulu untuk activate GPS
4. Pastikan Anda di luar ruangan (GPS lebih akurat)
```

### Q: Centang checklist tidak bisa?

```
1. Pastikan Anda sudah ambil foto SEBELUM
2. Centang SATU per SATU, tidak bisa sekaligus
3. Jika error, refresh halaman dan coba lagi
```

### Q: Foto tidak bisa diupload?

```
1. Pastikan koneksi internet stabil
2. Foto tersimpan lokal dulu, nanti diupload otomatis
3. Cek apakah storage HP masih ada ruang
```

### Q: Client tidak mau tanda tangan?

```
1. Jelaskan bahwa tanda tangan untuk validasi pekerjaan
2. Jika tetap tidak mau, pilih "Konfirmasi Tanpa TTD"
3. Laporan tetap dibuat dengan catatan "Menunggu TTD"
```

---

## 📞 Butuh Bantuan?

```
┌─────────────────────────────────────────────────────┐
│  HUBUNGI SUPERVISOR JIKA:                                  │
├─────────────────────────────────────────────────────┤
│                                                            │
│  ❌ GPS tidak bisa detect lokasi                          │
│  ❌ Ada masalah di lokasi (tidak bisa masuk, dll)          │
│  ❌ Client tidak ada untuk tanda tangan                   │
│  ❌ Ada kendala yang tidak bisa Anda pecahkan              │
│                                                            │
└─────────────────────────────────────────────────────┘
```

---

**Sebelumnya:** [Panduan Supervisor](SUPERVISOR_GUIDE.md)
