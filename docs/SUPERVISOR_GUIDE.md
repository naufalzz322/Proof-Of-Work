# 👁️ Panduan Supervisor

Panduan ini untuk Anda yang punya peran **Supervisor**. Supervisor bertugas memantau pekerja lapangan dan memastikan pekerjaan berjalan lancar.

---

## 📋 Daftar Isi

1. [Halaman Utama](#1-halaman-utama)
2. [Melihat Status Worker](#2-melihat-status-worker)
3. [Memahami Alert / Peringatan](#3-memahami-alert--peringatan)
4. [Melihat Detail Job](#4-melihat-detail-job)
5. [Melacak Progres](#5-melacak-progres)

---

## 1. Halaman Utama

Setelah login di `/supervisor/dashboard`, Anda akan lihat tampilan seperti ini:

```
┌─────────────────────────────────────────────────────┐
│  👁️ MONITORING TIM                                    │
│  Senin, 15 Juli 2026                                    │
├─────────────────────────────────────────────────────┤
│                                                        │
│  ⚠️ 2 job perlu perhatian | 1 worker telat             │
│                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │  5   │ │  3   │ │  2   │ │  1   │                 │
│  │ Total│ │Sudah │ │Belum │ │Progress│                 │
│  │ Job  │ │Checkin│ │Checkin│ │Rendah│                 │
│  └──────┘ └──────┘ └──────┘ └──────┘                 │
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │  STATUS WORKER                                    │   │
│  │  ────────────────────────────────────────────│   │
│  │  🟢 Budi      Kerja    Job A    75%          │   │
│  │  🟢 Siti      Kerja    Job B    45%          │   │
│  │  🟡 Wati      Istirahat Job A    80%          │   │
│  │  🔴 Jono      Terlambat   -      -            │   │
│  └──────────────────────────────────────────────┘   │
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │  JOB HARI INI                                    │   │
│  │  ────────────────────────────────────────────│   │
│  │  Job A    Client X   60%   ●                  │   │
│  │  Job B    Client Y   30%   ●                  │   │
│  │  Job C    Client Z    0%   ○                  │   │
│  └──────────────────────────────────────────────┘   │
│                                                        │
└─────────────────────────────────────────────────────┘
```

### Arti Statistic di Atas

| Kotak | Arti |
|-------|------|
| **Total Job** | Jumlah pekerjaan untuk hari ini |
| **Sudah Check-in** | Worker yang sudah tiba di lokasi |
| **Belum Check-in** | Worker yang belum tiba |
| **Progress Rendah** | Pekerjaan yang kurang dari 50% selesai |

---

## 2. Melihat Status Worker

### Arti Status Worker

```
┌─────────────────────────────────────────────────────┐
│  ARTI STATUS WORKER                                     │
├─────────────────────────────────────────────────────┤
│                                                        │
│  🟢  KERJA (Working)                                  │
│     → Worker sedang bekerja di lokasi                    │
│                                                        │
│  🟡  ISTIRAHAT (On Break)                             │
│     → Worker sedang istirahat sementara                    │
│                                                        │
│  ⚫  MENGANGGUR (Idle)                                │
│     → Worker tidak punya job hari ini                    │
│                                                        │
│  🔴  TERLAMBAT (Late)                                  │
│     → Worker belum check-in padahal sudah waktunya        │
│                                                        │
└─────────────────────────────────────────────────────┘
```

### Arti Kartu Worker

```
┌──────────────────┐
│  🟢 BS            │  ← Inisial nama (Budi Siti)
│  Budi Siti       │  ← Nama lengkap
│  Kerja           │  ← Status saat ini
│  Job Pembersihan │  ← Job yang sedang dikerjakan
│  ████████░░ 75% │  ← Progres penyelesaian
└──────────────────┘
```

### Worker dengan Progress Rendah

Worker yang progresnya kurang dari 50% akan terlihat berbeda:

```
┌──────────────────┐
│  🔴 BS            │  ← Border merah = perlu perhatian
│  Budi Siti       │
│  Kerja           │
│  Job Pembersihan │
│  ████░░░░░░ 25%│  ← Progress rendah
└──────────────────┘
```

---

## 3. Memahami Alert / Peringatan

### Banner Peringatan Kuning

Di atas halaman ada banner kuning yang menunjukkan masalah:

| Alert | Arti | Yang Harus Dilakukan |
|-------|------|---------------------|
| **Job perlu perhatian** | Ada job dengan progress kurang dari 50% | Cek worker yang bersangkutan |
| **Worker telat** | Worker check-in setelah jadwal | Catat untuk evaluasi |
| **Belum check-in** | Worker belum tiba di lokasi | Hubungi worker |

### Kapan Harus Bertindak?

```
┌─────────────────────────────────────────────────────┐
│  🚨  SEGERA AKSI                                                     │
├─────────────────────────────────────────────────────┤
│                                                                        │
│  JIKA:                                                                 │
│  • Progress kurang dari 25% padahal sudah lewat setengah waktu              │
│  • Worker tidak respond selama 1 jam                                      │
│  • Ada kendala di lokasi (access denied, dll)                            │
│                                                                        │
│  YANG HARUS DILAKUKAN:                                                │
│  → Langsung hubungi worker                                             │
│  → Atau hubungi admin untuk solusi                                     │
│                                                                        │
└─────────────────────────────────────────────────────┘
```

### Group Job Berdasarkan Waktu

Job dikelompokkan berdasarkan jam jadwal:

| Group | Jam | Warna Header |
|-------|-----|-------------|
| **Pagi** | 06:00 - 12:00 | Kuning |
| **Siang** | 12:00 - 17:00 | Kuning muda |
| **Sore** | 17:00 - 21:00 | Orange |
| **Malam** | 21:00 - 06:00 | Ungu |

---

## 4. Melihat Detail Job

### Dari Dashboard

1. Klik salah satu job di daftar "Job Hari Ini"
2. Akan terlihat detail:

```
┌─────────────────────────────────────────────────────┐
│  JOB: Pembersihan gedung A                            │
│  LAP-20260715-001                                   │
├─────────────────────────────────────────────────────┤
│                                                        │
│  Klien     : PT Maju Bersama                       │
│  Lokasi    : Jl. Sudirman No. 88                    │
│  Jadwal    : 08:00                                  │
│  Status     : ● SEDANG BERJALAN                     │
│                                                        │
│  PROGRESS                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░ 60%           │
│                                                        │
│  AREA                                                  │
│  ┌──────────────────────────────────────────────┐   │
│  │ Lobby        ████████░░░░ 80%                  │   │
│  │ Toilet       ██████████░░ 100% ✓               │   │
│  │ Ruang Meeting ████░░░░░░░ 40%                  │   │
│  └──────────────────────────────────────────────┘   │
│                                                        │
│  [ LIHAT DETAIL LENGKAP ]                              │
│                                                        │
└─────────────────────────────────────────────────────┘
```

### Lihat Detail Lengkap

Klik **"Detail →"** untuk lihat:
- Semua area dan checklist
- Worker yang mengerjakan
- Jam check-in masing-masing worker
- Foto yang sudah diupload
- Jika ada yang terlambat check-in

---

## 5. Melacak Progres

### Cara Hitung Progress

```
Progress = Jumlah Selesai / Jumlah Total × 100%

Contoh:
- Job punya 4 area dengan 20 checklist
- Worker selesai 12 item
- Progress = 12/20 × 100% = 60%
```

### Arti Warna Progress

| Progress | Warna | Arti |
|----------|-------|------|
| 0-24% | Merah | Perlu perhatian segera |
| 25-49% | Orange | Kurang dari seharusnya |
| 50-99% | Orange | Masih on track |
| 100% | Hijau | Selesai! |

### Update Otomatis

Halaman dashboard **refresh otomatis setiap 30 detik**. Yang bisa Anda lihat:
- Status worker terbaru
- Progress terbaru
- Check-in terbaru

### Feed Aktivitas

Aktivitas terbaru muncul di bagian bawah:

```
┌─────────────────────────────────────────────────────┐
│  AKTIVITAS TERBARU                                    │
│  ─────────────────────────────────────────────────── │
│  Budi check-in    Job A @ Client X      5 menit lalu  │
│  Siti check-in    Job B @ Client Y     12 menit lalu │
│  Jono check-in    Job C @ Client Z     25 menit lalu │
└─────────────────────────────────────────────────────┘
```

---

## 📅 Rutinitas Monitoring

### Pagi (07:00 - 09:00)

```
1. Buka dashboard
2. Cek job yang jadwalnya hari ini
3. Identifikasi worker yang belum check-in
4. Hubungi worker jika ada yang terlambat
```

### Siang (10:00 - 12:00)

```
1. Cek progress pekerjaan
2. Follow up job yang progressnya rendah
3. Dokumentasikan jika ada kendala
```

### Sore (14:00 - 17:00)

```
1. Pastikan job yang selesai, benar-benar selesai
2. Catat masalah untuk evaluasi
3. Laporkan ke admin jika ada isu besar
```

---

## 🚨 Kapan Hubungi Admin?

Hubungi admin jika:

```
┌─────────────────────────────────────────────────────┐
│  🚨  SEGERA HUBUNGI ADMIN                                  │
├─────────────────────────────────────────────────────┤
│                                                                │
│  Hubungi admin jika:                                           │
│                                                                │
│  ❌ Worker tidak respond lebih dari 1 jam                       │
│  ❌ Progress stuck di 0%                                       │
│  ❌ Worker ada masalah di lokasi (tidak bisa masuk, dll)          │
│  ❌ Ada komplain dari client                                     │
│  ❌ Job tidak bisa selesai hari ini                               │
│                                                                │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Yang Penting Aja (Ringkasan Supervisor)

```
┌─────────────────────────────────────────────────────┐
│  YANG WAJIB DIINGAT UNTUK SUPERVISOR                         │
├─────────────────────────────────────────────────────┤
│                                                                │
│  👁️ MONITORING                                              │
│  → Cek dashboard setiap pagi                                 │
│  → Identifikasi worker yang bermasalah                        │
│  → Follow up progress yang rendah                            │
│                                                                │
│  📊 YANG DIPOIN                                            │
│  → Total job hari ini                                       │
│  → Worker yang sudah/belum check-in                         │
│  → Progress job (< 50% = perlu perhatian)                     │
│                                                                │
│  🔴 STATUS MERAH / ORANGE                                   │
│  → Border merah di kartu worker = progress rendah             │
│  → Worker belum check-in padahal sudah waktunya               │
│                                                                │
│  📞 KAPAN HUBUNGI ADMIN                                    │
│  → Worker tidak bisa dihubungin                              │
│  → Ada masalah besar di lokasi                               │
│  → Job tidak bisa diselesaikan                               │
│                                                                │
└─────────────────────────────────────────────────────┘
```

---

## ❓ Pertanyaan Umum Supervisor

### Q: Worker saya belum check-in, apa yang harus saya lakukan?

```
1. Cek jam berapa job dijadwalkan
2. Hubungi worker via WhatsApp atau telepon
3. Jika tidak ada respons, laporkan ke admin
```

### Q: Job progress stuck di 0%, apa yang harus dilakukan?

```
1. Cek apakah worker sudah check-in
2. Hubungi worker untuk tanya status
3. Jika ada kendala (access, dll), bantu cari solusi
4. Jika tidak bisa dipecahkan, laporkan ke admin
```

### Q: Alert di dashboard tidak hilang-hilang?

```
1. Cek job tersebut
2. Pastikan worker sudah mengerjakan
3. Progress akan update otomatis
4. Jika masih bermasalah, hubungi admin
```

---

**Sebelumnya:** [Panduan Utama](USER_GUIDE.md) | **Selanjutnya:** [Panduan Worker](FIELD_WORKER_GUIDE.md)
