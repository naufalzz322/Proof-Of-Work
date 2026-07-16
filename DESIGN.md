# DESIGN.md — Proof of Work Generator
**Segmen 06 · Jasa**

---

## 1. Design Principles

**Tiga interface, satu tujuan: credibility.** Field worker butuh app yang bisa dipakai satu tangan di lapangan. Supervisor butuh visibility tanpa kompleksitas. Klien butuh laporan yang terlihat resmi dan tidak bisa dipalsukan.

1. **Field worker: brutal simplicity** — satu aksi per layar, tombol besar, tidak ada kebingungan
2. **Laporan PDF: dokumen resmi, bukan printout biasa** — harus terlihat seperti dari perusahaan besar
3. **Trust signals di mana-mana** — GPS coordinates, timestamp, foto metadata — semua visible

---

## 2. Color System

### Field Worker Mobile
```
Background:  #F0F9FF  (biru sangat muda — bersih, profesional)
Primary:     #0369A1  (biru solid — kepercayaan, korporat)
Surface:     #FFFFFF
Success:     #16A34A  (checklist selesai, foto uploaded)
Warning:     #D97706  (belum selesai, perlu perhatian)
Text:        #0F172A
```

### Admin & Supervisor
```
Background:  #F8F9FA
Primary:     #0369A1
Border:      #E2E8F0

Status in_progress: #D97706 amber
Status completed:   #16A34A hijau
Status draft:       #6B7280 abu
```

### PDF Report
```
Header background: #0369A1 (biru korporat)
Header text:       #FFFFFF
Section heading:   #0369A1
Border/divider:    #CBD5E1
Body text:         #1E293B
Checkmark color:   #16A34A
Footer:            #64748B (abu muted)
```

---

## 3. Field Worker Mobile Layout

### Halaman Job Hari Ini
```
[Header: avatar + nama field worker | tanggal hari ini]

[Card job]:
  Status badge (HARI INI / BESOK / SELESAI)
  Nama job: 18px bold
  Klien: 14px
  Alamat: 14px muted
  Jam terjadwal: 14px
  [MULAI KERJA] — tombol full-width 52px, biru solid

Jika sudah check-in:
  Badge "✓ Check-in 08:15" hijau
  [LANJUT KE CHECKLIST] — tombol hijau
```

### Halaman Check-in
```
[Animasi loading "Mendeteksi lokasi..."]
[Jika dalam radius]:
  ✅ Lokasi terverifikasi
  📍 Jl. [nama jalan], Surabaya
  🕐 08:15:23
  [KONFIRMASI CHECK-IN] — besar, hijau
  
[Jika di luar radius]:
  ⚠️ Kamu di luar lokasi kerja (350m)
  [Saya Sudah di Lokasi - Lanjutkan Dengan Catatan]  ← tombol secondary
```

### Halaman Area & Checklist
```
[Progress header]: Area 2 dari 4 | 60% selesai

[List area]:
  ● Lobby — 4/6 tugas ✓ — [Lanjut]
  ● Toilet L1 — Belum dimulai — [Mulai]
  ○ Toilet L2 — Selesai ✓ — [Lihat]
  ○ Ruang Meeting — Selesai ✓ — [Lihat]

[Dalam satu area]:
  [Foto Before] — kamera button besar
  
  Checklist:
  □ Lantai disapu
  □ Lantai dipel
  □ Kaca dibersihkan
  □ Sampah dibuang
  (centang satu per satu — tidak ada "select all")
  
  [Foto After] — aktif hanya setelah semua checklist ✓
```

### Halaman Tanda Tangan
```
[Heading]: Minta tanda tangan PIC klien

[Preview ringkasan]:
  4 area selesai ✓
  12 foto diupload ✓
  32 checklist selesai ✓

[Form]:
  Nama PIC: [input]
  Jabatan: [input]

[Signature Pad]:
  Area 300×150px, border 2px dashed
  "Tanda tangan di sini"
  [Hapus] | [Konfirmasi TTD]

[BUAT LAPORAN] — full-width, biru solid
```

---

## 4. Supervisor Dashboard

```
Top: 3 cards
  Tim Aktif Hari Ini | Sudah Check-in | Belum Check-in

Tabel tim:
  Kolom: Nama | Job | Lokasi | Check-in | Progress | Status

Filter: tanggal, klien, status

Real-time: auto-refresh setiap 60 detik
```

---

## 5. PDF Report Design

```
Halaman 1:
┌────────────────────────────────────────┐
│ [LOGO PERUSAHAAN]    [LOGO KLIEN]     │  ← header bg biru
│ LAPORAN PEKERJAAN                      │
│ No: LAP-2026-10-0089                  │
│ Tanggal: 15 Oktober 2026              │
├────────────────────────────────────────┤
│ INFORMASI PEKERJAAN                   │
│ Klien: PT ABC Indonesia               │
│ Lokasi: Jl. ... Surabaya              │
│ Tim: [Nama field worker]               │
│ Mulai: 08:15 | Selesai: 11:30         │
│ GPS: -7.2575, 112.7521                │
├────────────────────────────────────────┤
│ AREA 1: LOBBY                         │
│ [Foto Before 48%] | [Foto After 48%]  │
│ Checklist: ✓✓✓✓ (semua selesai)      │
├────────────────────────────────────────┤
│ ... (area berikutnya)                 │
├────────────────────────────────────────┤
│ TANDA TANGAN KLIEN                    │
│ [Gambar signature]                    │
│ Nama: Budi Santoso                    │
│ Jabatan: Facility Manager             │
│ Waktu TTD: 11:32 WIB                  │
├────────────────────────────────────────┤
│ Dokumen digenerate otomatis oleh      │
│ sistem Pytagotech · pytagotech.com    │
└────────────────────────────────────────┘
```

---

## 6. Signature Pad Component

```
Library: react-signature-canvas atau signature_pad
Canvas: 300×150px minimum, responsive
Stroke: width 2-3px, smooth, black
Background: white
Clear button: kanan atas
Validation: cek isEmpty() sebelum submit — jika kosong, tampilkan error
Export: .toDataURL('image/png') untuk simpan ke DB dan embed ke PDF
```
