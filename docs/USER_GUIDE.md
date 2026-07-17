# 📱 Panduan Penggunaan Aplikasi Proof of Work

Selamat datang! Panduan ini akan membantu Anda menggunakan aplikasi dengan mudah.

---

## 📋 Daftar Isi

1. [Cara Login](#1-cara-login)
2. [Daftar Peran](#2-daftar-peran)
3. [Cara Kerja WhatsApp Otomatis](#3-cara-kerja-whatsapp-otomatis)
4. [Panduan Berdasarkan Peran](#4-panduan-berdasarkan-peran)
5. [Pertanyaan Yang Sering Ditanyakan](#5-pertanyaan-yang-sering-ditanyakan)

---

## 1. Cara Login

### 📌 Yang Anda Butuhkan

| Yang Perlu | Contoh |
|-----------|--------|
| Email | `admin@pytagotech.com` |
| Password | `admin123` |

### 🔐 Login Berdasarkan Peran

| Peran | Email | Password | Buka Link Ini |
|--------|-------|---------|--------------|
| Admin | `admin@pytagotech.com` | `admin123` | `/admin/dashboard` |
| Supervisor | `supervisor@pytagotech.com` | `admin123` | `/supervisor/dashboard` |
| Field Worker | `budi@field.com` | `field123` | `/field/jobs` |

### 📸 Layar Login

<img width="1358" height="648" alt="image" src="https://github.com/user-attachments/assets/cd15521f-3153-4faa-9862-433eef19fdba" />

### Langkah Login:

```
1. Buka link sesuai peran Anda
2. Masukkan email Anda
3. Masukkan password Anda
4. Klik tombol "Masuk" atau "Login"
```

> 💡 **Tips:** Setelah login, Anda akan langsung masuk ke halaman utama sesuai peran Anda.

---

## 2. Daftar Peran

### 🤔 Peran Saya Yang Mana?

```
┌─────────────────────────────────────────────────────┐
│  PERAN & TUGAS                                          │
├─────────────────────────────────────────────────────┤
│                                                        │
│  👑 ADMIN                                              │
│  ├── Membuat job baru                                   │
│  ├── Menambah client (pelanggan)                      │
│  ├── Menambah worker (pekerja lapangan)               │
│  ├── Mengirim laporan ke email client                 │
│  └── Download laporan PDF                              │
│                                                        │
│  👁️ SUPERVISOR                                        │
│  ├── Melihat pekerjaan tim hari ini                    │
│  ├── Melihat siapa yang sudah / belum check-in       │
│  ├── Melihat progres pekerjaan                        │
│  └── Mengecek jika ada yang terlambat                │
│                                                        │
│  👷 WORKER (PEKERJA LAPANGAN)                         │
│  ├── Melihat daftar pekerjaan hari ini                 │
│  ├── Check-in saat tiba di lokasi                     │
│  ├── Mengerjakan checklist per area                  │
│  ├── Ambil foto sebelum & sesudah                     │
│  └── Minta tanda tangan client                        │
│                                                        │
└─────────────────────────────────────────────────────┘
```

### Perbandingan Singkat

| Yang Dilakukan | Admin | Supervisor | Worker |
|----------------|:-----:|:----------:|:------:|
| Buat job baru | ✅ | ❌ | ❌ |
| Lihat pekerjaan tim | ❌ | ✅ | ❌ |
| Check-in GPS | ❌ | ❌ | ✅ |
| Kerjakan checklist | ❌ | ❌ | ✅ |
| Kirim laporan email | ✅ | ❌ | ❌ |
| Download laporan PDF | ✅ | ✅ | ❌ |

---

## 3. Panduan Berdasarkan Peran

Pilih panduan sesuai peran Anda:

| Peran | Buka Panduan |
|-------|-------------|
| Admin | [📋 Panduan Admin](ADMIN_GUIDE.md) |
| Supervisor | [👁️ Panduan Supervisor](SUPERVISOR_GUIDE.md) |
| Worker | [👷 Panduan Worker](FIELD_WORKER_GUIDE.md) |

---

## 4. Pertanyaan Yang Sering Ditanyakan

### ❓ Tidak bisa login?

```
1. Pastikan email benar (contoh: admin@pytagotech.com)
2. Pastikan password benar
3. Pastikan Anda buka link yang sesuai peran:
   - Admin → /admin/dashboard
   - Supervisor → /supervisor/dashboard
   - Worker → /field/jobs
```

### ❓ Check-in GPS gagal?

```
1. Pastikan GPS / Lokasi di HP aktif
2. Pastikan browser izinkan akses lokasi
3. Pastikan Anda di lokasi pekerjaan (radius 200 meter)
4. Jika di luar area, harus isi alasan
```

### ❓ Laporan PDF tidak bisa dibuat?

```
1. Pastikan semua checklist sudah selesai
2. Pastikan foto sudah diupload
3. Pastikan ada tanda tangan client
4. Hubungi admin jika masih error
```

### ❓ Job menunjukkan "Terlambat"?

```
Artinya: Pekerjaan sudah melewati jadwal tapi belum selesai.

Ini bukan masalah besar, tapi sebaiknya segera dihabiskan.

Yang perlu dilakukan:
- Hubungi worker untuk segera diselesaikan
- Atau ubah jadwal job jika ada alasan
```

---

## 🎯 Yang Penting Aja (Ringkasan)

```
┌─────────────────────────────────────────────────────┐
│  YANG WAJIB DIINGAT                                       │
├─────────────────────────────────────────────────────┤
│                                                        │
│  🔑 LOGIN                                              │
│  → Email & password sesuai peran Anda                   │
│  → Buka link yang sesuai                               │
│                                                        │
│  📍 CHECK-IN                                           │
│  → Worker HARUS check-in di lokasi pekerjaan            │
│  → Radius maksimal 200 meter                            │
│  → Jika di luar area, harus isi alasan                  │
│                                                        │
│  ✅ SELESAI JOB                                        │
│  → Semua checklist harus selesai                         │
│  → Ambil foto sebelum & sesudah                        │
│  → Client harus tanda tangan                            │
│                                                        │
│  📄 LAPORAN                                           │
│  → PDF otomatis dibuat setelah client tanda tangan       │
│  → Admin bisa kirim ke email client                     │
│                                                        │
└─────────────────────────────────────────────────────┘
```

---

## 📞 Butuh Bantuan?

Jika ada masalah yang tidak ada di panduan ini:

1. **Hubungi Supervisor** Anda untuk masalah pekerjaan
2. **Hubungi Admin** untuk masalah sistem
3. **Cek status** di menu Notifikasi

---

**Versi:** 1.0  
**Terakhir Diperbarui:** Juli 2026
