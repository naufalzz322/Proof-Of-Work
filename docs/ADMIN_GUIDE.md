# 👑 Panduan Admin

Panduan ini untuk Anda yang punya peran **Admin**. Admin bisa mengatur semuanya: client, worker, job, dan laporan.

---

## 📋 Daftar Isi

1. [Halaman Utama](#1-halaman-utama)
2. [Mengatur Client (Pelanggan)](#2-mengatur-client-pelanggan)
3. [Mengatur Worker (Pekerja)](#3-mengatur-worker-pekerja)
4. [Membuat Job Baru](#4-membuat-job-baru)
5. [Mengirim Laporan](#5-mengirim-laporan)
6. [Notifikasi](#6-notifikasi)

---

## 1. Halaman Utama

Setelah login di `/admin/dashboard`, Anda akan lihat tampilan seperti ini:

```
┌─────────────────────────────────────────────────────┐
│  👋 Selamat Datang, Admin                               │
│  Senin, 15 Juli 2026                                   │
├─────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │  5   │ │  3   │ │  8   │ │  1   │              │
│  │ Job  │ │Aktif │ │Worker│ │Report│              │
│  │ Hari │ │      │ │Aktif │ │Pending│              │
│  │ Ini  │ │      │ │      │ │      │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │  JOB HARI INI                                  │   │
│  │  ──────────────────────────────────────────── │   │
│  │  Pembersihan Gedung A  │ PT Maju │ 08:00 │ ●  │   │
│  │  Cuci Karpet Kantor   │ PT ABC  │ 10:00 │ ○  │   │
│  │  Cuci Kaca Kantor   │ PT XYZ  │ 14:00 │ ○  │   │
│  └──────────────────────────────────────────────┘   │
│                                                        │
└─────────────────────────────────────────────────────┘
```

### Arti Statistic di Atas

| Kotak | Arti |
|-------|------|
| **Job Hari Ini** | Jumlah pekerjaan untuk hari ini |
| **Aktif** | Pekerjaan yang sedang dikerjakan |
| **Worker Aktif** | Jumlah pekerja yang sudah check-in |
| **Report Pending** | Pekerjaan selesai tapi belum kirim laporan |

---

## 2. Mengatur Client (Pelanggan)

### Apa Itu Client?

**Client** adalah pelanggan Anda. Contoh:
- PT Maju Bersama
- PT ABC Indonesia
- Toko Buku Cerdas

### Lihat Daftar Client

1. Klik menu **Klien** di sidebar kiri
2. Akan lihat semua client yang sudah terdaftar
3. Klik nama client untuk lihat detail

### Tambah Client Baru

```
LANGKAH 1: Klik tombol "+ Klien Baru"

LANGKAH 2: Isi form seperti ini:

┌─────────────────────────────────────────────────────┐
│  TAMBAH CLIENT BARU                                    │
├─────────────────────────────────────────────────────┤
│                                                        │
│  Nama Perusahaan *                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ PT Maju Bersama Indonesia                        │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  Nama Kontak *                                        │
│  ┌───────────────────────────────────────────────┐ │
│  │ Budi Santoso                                    │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  No. Telepon                                         │
│  ┌───────────────────────────────────────────────┐ │
│  │ 081234567890                                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  Email                                               │
│  ┌───────────────────────────────────────────────┐ │
│  │ budi@ptmaju.co.id                              │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  Alamat                                             │
│  ┌───────────────────────────────────────────────┐ │
│  │ Jl. Sudirman No. 88, Jakarta                  │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│            [ SIMPAN ]                                 │
└─────────────────────────────────────────────────────┘
```

> 💡 **Tips:** Yang bertanda * wajib diisi.

### Edit Client

1. Klik nama client di daftar
2. Klik tombol **Edit**
3. Ubah data yang mau diubah
4. Klik **Simpan**

---

## 3. Mengatur Worker (Pekerja)

### Apa Itu Worker?

**Worker** adalah pekerja lapangan yang mengerjakan job. Contoh:
- Budi (Worker)
- Siti (Worker)
- Jono (Worker)

### Status Worker

| Status | Arti | Warna |
|--------|------|-------|
| **Tersedia** | Bisa ditugaskan | 🟢 Hijau |
| **Sibuk** | Sedang kerja di job lain | 🟠 Orange |
| **Cuti** | Sedang tidak masuk | 🔴 Merah |

### Tambah Worker Baru

```
LANGKAH 1: Klik menu "Worker" di sidebar

LANGKAH 2: Klik tombol "+ Tambah Worker"

LANGKAH 3: Isi form:

┌─────────────────────────────────────────────────────┐
│  TAMBAH WORKER BARU                                   │
├─────────────────────────────────────────────────────┤
│                                                        │
│  Nama *                                               │
│  ┌───────────────────────────────────────────────┐ │
│  │ Siti Worker                                     │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  Email * (untuk login)                                │
│  ┌───────────────────────────────────────────────┐ │
│  │ siti@field.com                                  │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  No. HP / WhatsApp *                                  │
│  ┌───────────────────────────────────────────────┐ │
│  │ 081234567891                                     │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  Peran                                                │
│  ┌───────────────────────┐                           │
│  │ ● Field Worker       │  ← Pilih ini              │
│  └───────────────────────┘                           │
│                                                        │
│            [ SIMPAN ]                                 │
└─────────────────────────────────────────────────────┘
```

> ⚠️ **Penting:** 
> - Password default untuk worker baru: `field123`
> - Worker wajib punya nomor WhatsApp untuk dapat notifikasi job

---

## 4. Membuat Job Baru

### Apa Itu Job?

**Job** adalah pekerjaan yang harus dikerjakan. Contoh:
- "Pembersihan Gedung A Lt.3"
- "Cuci Karpet Kantor"
- "Cuci Kaca Luar Gedung"

### Langkah-Langkah Membuat Job

```
┌─────────────────────────────────────────────────────┐
│  LANGKAH-LANGKAH MEMBUAT JOB BARU                      │
├─────────────────────────────────────────────────────┤
│                                                        │
│  LANGKAH 1: Klik menu "Pekerjaan"                      │
│                                                        │
│  LANGKAH 2: Klik tombol "+ Buat Job Baru"               │
│                                                        │
│  LANGKAH 3: Isi form step by step                     │
│                                                        │
└─────────────────────────────────────────────────────┘
```

### Step 1: Info Dasar Job

```
┌─────────────────────────────────────────────────────┐
│  STEP 1: INFO DASAR                                    │
├─────────────────────────────────────────────────────┤
│                                                        │
│  Judul Job *                                           │
│  ┌───────────────────────────────────────────────┐ │
│  │ Pembersihan Gedung A Lt.3                       │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  Pilih Klien *                                        │
│  ┌───────────────────────────────────────────────┐ │
│  │ [Pilih Client...]                          ▼  │ │
│  │   PT Maju Bersama                            │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  Deskripsi (optional)                                  │
│  ┌───────────────────────────────────────────────┐ │
│  │ Cleaning service setelah jam kerja              │ │
│  │ Kantor tutup jam 17:00                         │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│                      [ LANJUT → ]                     │
└─────────────────────────────────────────────────────┘
```

### Step 2: Lokasi

```
┌─────────────────────────────────────────────────────┐
│  STEP 2: LOKASI                                       │
├─────────────────────────────────────────────────────┤
│                                                        │
│  Alamat *                                              │
│  ┌───────────────────────────────────────────────┐ │
│  │ Jl. Sudirman No. 88, Jakarta                  │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  Titik GPS (untuk check-in)                            │
│  ┌───────────────────────────────────────────────┐ │
│  │ Latitude:  -7.2575                            │ │
│  │ Longitude: 112.7521                           │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  Radius Check-in * (meter)                            │
│  ┌───────────────────────────────────────────────┐ │
│  │ 200                                             │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  💡 Worker harus check-in dalam radius ini           │
│                                                        │
│              [ ← SEBELUMNYA ]  [ LANJUT → ]          │
└─────────────────────────────────────────────────────┘
```

> 💡 **Apa Itu Radius?**
> Radius adalah jarak maksimal worker boleh check-in dari titik lokasi. Default: 200 meter.
> Jika worker check-in lebih dari 200 meter, harus isi alasan.

### Step 3: Assign Worker

```
┌─────────────────────────────────────────────────────┐
│  STEP 3: PILIH WORKER                                  │
├─────────────────────────────────────────────────────┤
│                                                        │
│  Pilih worker yang mengerjakan job ini:                 │
│                                                        │
│  ┌─────────────────────────────────────────────┐    │
│  │ ☑ Budi Worker        🟢 Tersedia           │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ ☐ Siti Worker        🟠 Sibuk              │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ ☑ Jono Worker        🟢 Tersedia           │    │
│  └─────────────────────────────────────────────┘    │
│                                                        │
│  🟢 = Bisa dipilih    🟠 = Sedang sibuk              │
│                                                        │
│              [ ← SEBELUMNYA ]  [ LANJUT → ]          │
└─────────────────────────────────────────────────────┘
```

> ⚠️ **Tips:** Pilih worker yang statusnya **Tersedia** (hijau).

### Step 4: Jadwal

```
┌─────────────────────────────────────────────────────┐
│  STEP 4: JADWAL                                       │
├─────────────────────────────────────────────────────┤
│                                                        │
│  Tanggal *                                             │
│  ┌───────────────────────────────────────────────┐ │
│  │ 15/07/2026                                   │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│  Waktu *                                               │
│  ┌───────────────────────────────────────────────┐ │
│  │ 08:00                                          │ │
│  └───────────────────────────────────────────────┘ │
│                                                        │
│              [ ← SEBELUMNYA ]  [ LANJUT → ]          │
└─────────────────────────────────────────────────────┘
```

### Step 5: Area & Checklist

```
┌─────────────────────────────────────────────────────┐
│  STEP 5: AREA & CHECKLIST                            │
├─────────────────────────────────────────────────────┤
│                                                        │
│  AREA 1: Lobby Utama                                  │
│  ┌─────────────────────────────────────────────┐    │
│  │ □ Lantai disapu                                 │    │
│  │ □ Lantai dipel                                 │    │
│  │ □ Kaca dibersihkan                             │    │
│  │ □ Sampah dibuang                               │    │
│  └─────────────────────────────────────────────┘    │
│                                                        │
│  + Tambah Area                                        │
│                                                        │
│  ┌─────────────────────────────────────────────┐    │
│  │ AREA 2: Toilet Pria                           │    │
│  │ □ Lantai dicuci                                 │    │
│  │ □ Toilet dibersihkan                           │    │
│  │ □ Tissue diganti                               │    │
│  │                                            [×] │    │
│  └─────────────────────────────────────────────┘    │
│                                                        │
│              [ ← SEBELUMNYA ]  [ SIMPAN JOB ]         │
└─────────────────────────────────────────────────────┘
```

### Setelah Job Dibuat

```
┌─────────────────────────────────────────────────────┐
│  JOB BERHASIL DIBUAT! 🎉                               │
├─────────────────────────────────────────────────────┤
│                                                        │
│  ✅ Job tersimpan dengan status "Ditugaskan"           │
│                                                        │
│  📱 Worker mendapat pesan WhatsApp:                    │
│                                                        │
│  "📋 Job Baru!                                       │
│   Pembersihan Gedung A Lt.3                           │
│   Klien: PT Maju Bersama                             │
│   Tanggal: 15 Juli 2026 08:00                        │
│   Lokasi: Jl. Sudirman No. 88                         │
│                                                        │
│   [Buka App]"                                         │
│                                                        │
│  👁️ Supervisor bisa lihat job di dashboard mereka     │
│                                                        │
│              [ SELESAI ]  [ BUAT JOB LAGI ]          │
└─────────────────────────────────────────────────────┘
```

---

## 5. Mengirim Laporan

### Kapan Laporan PDF Dibuat?

Laporan PDF **otomatis dibuat** setelah:
1. ✅ Semua checklist selesai
2. ✅ Semua foto diupload
3. ✅ Client tanda tangan di signature pad

### Download Laporan

```
LANGKAH 1: Buka menu "Pekerjaan"

LANGKAH 2: Cari job yang sudah selesai (status hijau)

LANGKAH 3: Klik nama job

LANGKAH 4: Klik tombol "Download PDF"
```

### Kirim Laporan via Email

```
LANGKAH 1: Di halaman detail job, klik "Kirim Email"

LANGKAH 2: Pastikan email penerima benar
            (akan terisi otomatis dari data client)

LANGKAH 3: Klik "Kirim"

LANGKAH 4: Selesai! Email terkirim dengan lampiran PDF
```

---

## 6. Notifikasi

### Apa Itu Notifikasi?

Notifikasi adalah **pengingat atau alert** yang muncul di aplikasi. Contoh:

| Notifikasi | Kapan Muncul |
|-----------|-------------|
| Worker Check-in | Worker check-in di lokasi |
| Worker Terlambat | Worker check-in setelah jadwal |
| Client Tanda Tangan | Client sudah tanda tangan |
| Job Selesai | Semua pekerjaan selesai |

### Lihat Notifikasi

1. Klik menu **Notifikasi** di sidebar
2. Akan lihat semua notifikasi
3. Klik notifikasi untuk langsung ke job terkait

### Tandai Sudah Dibaca

```
Sudah dibaca → Klik tanda ✓ di samping notifikasi

Tandai semua → Klik tombol "✓✓ Tandai Semua Dibaca"

Hapus lama → Klik "🗑️ Hapus Terbaca"
```

---

## 🎯 Yang Penting Aja (Ringkasan Admin)

```
┌─────────────────────────────────────────────────────┐
│  YANG WAJIB DIINGAT UNTUK ADMIN                          │
├─────────────────────────────────────────────────────┤
│                                                        │
│  👑 BUAT JOB                                          │
│  → Klik "Buat Job Baru" di halaman Pekerjaan          │
│  → Isi semua data: client, worker, jadwal, area      │
│                                                        │
│  👥 KELOLA WORKER                                     │
│  → Tambah worker baru wajib isi nomor WhatsApp        │
│  → Password default worker: field123                   │
│                                                        │
│  📄 LAPORAN                                           │
│  → PDF otomatis setelah client tanda tangan           │
│  → Bisa download atau kirim via email                 │
│                                                        │
└─────────────────────────────────────────────────────┘
```

---

## ❓ Pertanyaan Umum Admin

### Q: Tidak bisa buat job?

```
Pastikan:
1. Client sudah dibuat dulu
2. Worker sudah ada dan statusnya "Tersedia"
3. Semua field yang wajib (*) sudah terisi
```

### Q: Laporan PDF tidak bisa dibuat?

```
Pastikan:
1. Semua checklist selesai dicentang
2. Foto sebelum & sesudah sudah diupload
3. Client sudah tanda tangan di signature pad
```

---

**Sebelumnya:** [Panduan Utama](USER_GUIDE.md) | **Selanjutnya:** [Panduan Supervisor](SUPERVISOR_GUIDE.md)
