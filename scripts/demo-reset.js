#!/usr/bin/env node
/**
 * Demo Reset Script
 *
 * Resets the database to a clean demo state with realistic data.
 *
 * Usage:
 *   npm run demo:reset    # Reset and seed
 *   npm run demo:status    # Show current data status
 *
 * Requirements:
 *   - DATABASE_URL must be set in .env.local
 *   - Node.js 18+
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, WorkerRole, JobStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// ANSI colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, "green");
}

function info(message) {
  log(`ℹ️  ${message}`, "blue");
}

function warn(message) {
  log(`⚠️  ${message}`, "yellow");
}

function error(message) {
  log(`❌ ${message}`, "red");
}

async function seed() {
  log("\n🔄 RESETTING DEMO DATABASE...\n", "bright");

  const startTime = Date.now();

  try {
    // Check database connection
    info("Checking database connection...");
    await prisma.$connect();
    success("Database connected");

    // Clear existing data
    info("Clearing existing data...");
    await prisma.jobReport.deleteMany();
    await prisma.clientSignature.deleteMany();
    await prisma.workSession.deleteMany();
    await prisma.areaPhoto.deleteMany();
    await prisma.checklistItem.deleteMany();
    await prisma.jobArea.deleteMany();
    await prisma.job.deleteMany();
    await prisma.worker.deleteMany();
    await prisma.client.deleteMany();
    success("Existing data cleared");

    // Create workers
    info("Creating workers...");
    const adminHash = await bcrypt.hash("admin123", 10);
    const fieldHash = await bcrypt.hash("field123", 10);

    await prisma.worker.createMany({
      data: [
        { name: "Dewi Lestari", email: "admin@pytagotech.com", passwordHash: adminHash, phone: "0812-3456-7890", role: WorkerRole.ADMIN },
        { name: "Ahmad Rizki", email: "supervisor@pytagotech.com", passwordHash: adminHash, phone: "0812-3456-7891", role: WorkerRole.SUPERVISOR },
        { name: "Budi Santoso", email: "budi@field.com", passwordHash: fieldHash, phone: "0813-4567-8901", role: WorkerRole.FIELD },
        { name: "Siti Aminah", email: "siti@field.com", passwordHash: fieldHash, phone: "0814-5678-9012", role: WorkerRole.FIELD },
        { name: "Joko Wijaya", email: "joko@field.com", passwordHash: fieldHash, phone: "0815-6789-0123", role: WorkerRole.FIELD },
        { name: "Ratna Sari", email: "ratna@field.com", passwordHash: fieldHash, phone: "0816-7890-1234", role: WorkerRole.FIELD },
      ],
    });
    success("Workers created");

    // Create clients
    info("Creating clients...");
    const clients = await Promise.all([
      prisma.client.create({
        data: { name: "PT Maju Bersama Indonesia", contactName: "Dr. Hendra Kusuma", contactPhone: "021-5789-1234", contactEmail: "hendra.kusuma@majubersama.co.id", address: "Jl. HR Rasuna Said Kav. C-17, Kuningan, Jakarta Selatan 12940" },
      }),
      prisma.client.create({
        data: { name: "PT Cerdas Digital Indonesia", contactName: "Rina Marlina", contactPhone: "031-5789-5678", contactEmail: "rina.marlina@cerdasdigital.id", address: "Jl. Surabaya No. 88, Gubeng, Surabaya 60272" },
      }),
      prisma.client.create({
        data: { name: "Hotel Bintang Timur", contactName: "Darmawan Hidayat", contactPhone: "022-7568-9012", contactEmail: "darmawan@hotelbintangtimur.co.id", address: "Jl. Merdeka No. 10, Braga, Bandung 40111" },
      }),
      prisma.client.create({
        data: { name: "Universitas Harvest Jaya", contactName: "Prof. Dr. Hadi Wijanto", contactPhone: "0274-8901-2345", contactEmail: "rektorat@harvestjaya.ac.id", address: "Jl. Kaliurang Km 14, Sleman, Yogyakarta 55581" },
      }),
      prisma.client.create({
        data: { name: "PT Nusantara Propertindo", contactName: "Mira Andriani", contactPhone: "061-8901-2345", contactEmail: "gm@nusantaraproperti.co.id", address: "Jl. Imam Bonjol No. 55, Medan 20112" },
      }),
    ]);
    success("Clients created");

    // Helper function to create job
    async function createJob(data) {
      const job = await prisma.job.create({
        data: {
          jobNumber: data.jobNumber,
          clientId: data.clientId,
          title: data.title,
          description: data.description,
          locationAddress: data.locationAddress,
          locationLat: data.locationLat,
          locationLng: data.locationLng,
          locationRadius: 200,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          status: data.status,
          notes: data.notes,
          areas: {
            create: data.areas.map((area, idx) => ({
              name: area.name,
              sortOrder: idx,
              items: { create: area.items.map(label => ({ label })) },
            )),
          },
        },
        include: { areas: { include: { items: true } } },
      });

      // Create work sessions
      for (const workerId of data.workerIds) {
        const hasCheckIn = data.status !== "DRAFT" && data.status !== "ASSIGNED";
        const checkInTime = hasCheckIn ? new Date(data.scheduledDate) : null;
        if (checkInTime) {
          const [hours, minutes] = data.scheduledTime.split(":").map(Number);
          checkInTime.setHours(hours || 8, minutes + 5, 0, 0);
        }
        await prisma.workSession.create({
          data: {
            jobId: job.id,
            workerId,
            checkInAt: checkInTime,
            checkInLat: hasCheckIn ? data.locationLat : null,
            checkInLng: hasCheckIn ? data.locationLng : null,
          },
        });
      }

      if (data.signature) {
        await prisma.clientSignature.create({
          data: {
            jobId: job.id,
            signatureUrl: "/signatures/demo-signature.png",
            signerName: data.signature.signerName,
            signerTitle: data.signature.signerTitle,
            signedAt: data.signature.signedAt,
          },
        });
      }

      return job;
    }

    // Create jobs
    info("Creating demo jobs...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Job 1: COMPLETED (yesterday) — for PDF demo
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const job1 = await createJob({
      jobNumber: "LAP-2026-07-0001",
      clientId: clients[0].id,
      title: "Pembersihan Rutin gedung Kantor Lt. 3 & 4",
      description: "Pembersihan lantai 3 dan 4 gedung perkantoran",
      locationAddress: "Jl. HR Rasuna Said Kav. C-17, Kuningan, Jakarta Selatan",
      locationLat: -6.2297,
      locationLng: 106.8301,
      scheduledDate: yesterday,
      scheduledTime: "08:00",
      status: JobStatus.COMPLETED,
      notes: "Tim harus menggunakan lift khusus barang.",
      areas: [
        { name: "Lobby Lt. 3", items: ["Lantai disapu bersih", "Lantai dipel dengan disinfektan", "Kaca pintu lobby dibersihkan", "Sampah dibuang ke TPS", "Dispenser air diisi ulang"] },
        { name: "Ruang Meeting A-C", items: ["Lantai disapu bersih", "Lantai dipel", "Meja rapat dilap debu", "Kursi dibersihkan", "AC dinyalakan", "Sampah dibuang"] },
        { name: "Toilet Pria Lt. 3", items: ["Lantai disapu", "Lantai dipel dengan disinfektan", "Cermin dicuci", "Toilet disikat dan disanitasi", "Sampah dibuang", "Pewangi ruangan disemprot"] },
        { name: "Toilet Wanita Lt. 3", items: ["Lantai disapu", "Lantai dipel dengan disinfektan", "Cermin dicuci", "Toilet disikat dan disanitasi", "Sampah dibuang", "Pewangi ruangan disispens"] },
      ],
      workerIds: [(await prisma.worker.findFirst({ where: { email: "budi@field.com" } })).id, (await prisma.worker.findFirst({ where: { email: "siti@field.com" } })).id],
      signature: { signerName: "Dr. Hendra Kusuma", signerTitle: "Facility Manager", signedAt: new Date(yesterday.getTime() + 4 * 60 * 60 * 1000) },
    });

    await prisma.jobReport.create({
      data: { jobId: job1.id, pdfUrl: `/reports/${job1.jobNumber}.pdf`, generatedAt: new Date(yesterday.getTime() + 4.5 * 60 * 60 * 1000), sentAt: new Date(yesterday.getTime() + 5 * 60 * 60 * 1000), sentToEmail: "hendra.kusuma@majubersama.co.id" },
    });

    // Job 2: IN_PROGRESS (today) — for live demo
    await createJob({
      jobNumber: "LAP-2026-07-0002",
      clientId: clients[1].id,
      title: "Pembersihan Area Produksi & Gudang",
      description: "Deep cleaning area produksi dan gudang",
      locationAddress: "Jl. Surabaya No. 88, Gubeng, Surabaya",
      locationLat: -7.2575,
      locationLng: 112.7521,
      scheduledDate: today,
      scheduledTime: "07:30",
      status: JobStatus.IN_PROGRESS,
      notes: "Area produksi tidak beroperasi. APD wajib.",
      areas: [
        { name: "Area Produksi Utama", items: ["Lantai disapu bersih", "Lantai dipel dengan degreaser", "Mesin produksi dilap", "Sampah industri dibuang", "Jalur evakuasi dibersihkan"] },
        { name: "Gudang Barang Jadi", items: ["Lantai disapu", "Lantai dipel", "Rak barang dilap debu", "Sampah dibuang", "Pintu gudang dilumuri"] },
        { name: "Ruang Ganti Karyawan", items: ["Lantai disapu", "Lantai dipel", "Cermin dicuci", "Sampah dibuang", "Pewangi disispens"] },
        { name: "Kantin & Area Makan", items: ["Lantai disapu", "Lantai dipel", "Meja makan dilap", "Kursi dibersihkan", "Sampah dibuang"] },
      ],
      workerIds: [(await prisma.worker.findFirst({ where: { email: "budi@field.com" } })).id, (await prisma.worker.findFirst({ where: { email: "joko@field.com" } })).id, (await prisma.worker.findFirst({ where: { email: "ratna@field.com" } })).id],
    });

    // Job 3: ASSIGNED (tomorrow)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await createJob({
      jobNumber: "LAP-2026-07-0003",
      clientId: clients[2].id,
      title: "Deep Cleaning 20 Kamar Hotel",
      description: "Deep cleaning kamar hotel setelah Liburan sekolah",
      locationAddress: "Jl. Merdeka No. 10, Braga, Bandung",
      locationLat: -6.9175,
      locationLng: 107.6191,
      scheduledDate: tomorrow,
      scheduledTime: "09:00",
      status: JobStatus.ASSIGNED,
      notes: "Checkout tamu 12:00. Tim masuk 13:00.",
      areas: [
        { name: "Kamar 101-110 (Lantai 1)", items: ["Kasur dirapikan", "Lantai disapu", "Lantai dipel", "Kamar mandi dibersihkan", "Handuk diganti", "Sampah dibuang"] },
        { name: "Kamar 201-210 (Lantai 2)", items: ["Kasur dirapikan", "Lantai disapu", "Lantai dipel", "Kamar mandi dibersihkan", "Handuk diganti", "Sampah dibuang"] },
        { name: "Lobby & Koridor Hotel", items: ["Lantai marble disapu", "Lantai marble dipel", "Sofa lobby dibersihkan", "Sampah dibuang"] },
      ],
      workerIds: [(await prisma.worker.findFirst({ where: { email: "siti@field.com" } })).id, (await prisma.worker.findFirst({ where: { email: "joko@field.com" } })).id, (await prisma.worker.findFirst({ where: { email: "ratna@field.com" } })).id],
    });

    // Job 4: DRAFT
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() + 3);

    await createJob({
      jobNumber: "LAP-2026-07-0004",
      clientId: clients[3].id,
      title: "Pembersihan Semester Ganjil — gedung A",
      description: "Pembersihan gedung A menjelang semester baru",
      locationAddress: "Jl. Kaliurang Km 14, Sleman, Yogyakarta",
      locationLat: -7.7628,
      locationLng: 110.3789,
      scheduledDate: thisWeek,
      scheduledTime: "08:00",
      status: JobStatus.DRAFT,
      notes: "Pending persetujuan dekan.",
      areas: [
        { name: "Lobby Utama gedung A", items: ["Lantai disapu", "Lantai dipel", "Kaca dibersihkan", "Sofa dilap"] },
        { name: "Ruang Kuliah Lt. 1-3", items: ["Lantai disapu", "Meja dosi dilap", "Kursi dibersihkan", "Papan tulis dicuci"] },
      ],
      workerIds: [],
    });

    // Job 5: INVOICED (last week)
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const job5 = await createJob({
      jobNumber: "LAP-2026-06-0028",
      clientId: clients[4].id,
      title: "Pembersihan Routine Kantor Medan",
      description: "Pembersihan mingguan kantor pusat Medan",
      locationAddress: "Jl. Imam Bonjol No. 55, Medan",
      locationLat: 3.5881,
      locationLng: 98.6728,
      scheduledDate: lastWeek,
      scheduledTime: "08:00",
      status: JobStatus.INVOICED,
      areas: [
        { name: "Lobby & Reception", items: ["Lantai disapu", "Lantai dipel", "Meja resepsionis dilap"] },
        { name: "Ruang Kerja Lantai 2", items: ["Lantai disapu", "Lantai dipel", "Meja kerja dilap"] },
      ],
      workerIds: [(await prisma.worker.findFirst({ where: { email: "budi@field.com" } })).id],
      signature: { signerName: "Mira Andriani", signerTitle: "General Manager", signedAt: new Date(lastWeek.getTime() + 3 * 60 * 60 * 1000) },
    });

    await prisma.jobReport.create({
      data: { jobId: job5.id, pdfUrl: `/reports/${job5.jobNumber}.pdf`, generatedAt: new Date(lastWeek.getTime() + 4 * 60 * 60 * 1000), sentAt: new Date(lastWeek.getTime() + 5 * 60 * 60 * 1000), sentToEmail: "gm@nusantaraproperti.co.id" },
    });

    success("Demo jobs created");

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n" + "═".repeat(60));
    log("  ✅ DEMO DATABASE RESET COMPLETE", "bright green");
    console.log("═".repeat(60) + "\n");

    console.log("📊 Data Summary:");
    console.log(`   • ${clients.length} Corporate Clients`);
    console.log("   • 6 Workers (1 admin, 1 supervisor, 4 field)");
    console.log("   • 5 Jobs (various statuses)");
    console.log("     - 1 COMPLETED (with PDF & signature) ← Demo PDF");
    console.log("     - 1 IN_PROGRESS (today) ← Live demo");
    console.log("     - 1 ASSIGNED (tomorrow)");
    console.log("     - 1 DRAFT (pending approval)");
    console.log("     - 1 INVOICED (last week)");

    console.log("\n" + "═".repeat(60));
    log("  🔐 LOGIN CREDENTIALS", "bright");
    console.log("═".repeat(60) + "\n");

    log("  👤 Admin (Full dashboard access):", "yellow");
    log("     admin@pytagotech.com / admin123\n");
    log("  👤 Supervisor (Monitor team):", "yellow");
    log("     supervisor@pytagotech.com / admin123\n");
    log("  👤 Field Workers (Mobile app):", "yellow");
    log("     budi@field.com / field123");
    log("     siti@field.com / field123");
    log("     joko@field.com / field123");
    log("     ratna@field.com / field123\n");

    console.log("═".repeat(60));
    log("  🚀 RECOMMENDED DEMO FLOW", "bright");
    console.log("═".repeat(60) + "\n");
    log("  1. Login as Admin → View dashboard");
    log("  2. Show job list with different statuses");
    log("  3. Login as Field (Budi) → Continue IN_PROGRESS job");
    log("  4. Complete checklist → Sign → Generate PDF");
    log("  5. Login as Admin → Download and show PDF report\n");

    log(`  Completed in ${elapsed}s\n`, "cyan");

  } catch (err) {
    error(`Seed failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if .env.local exists
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  error(".env.local not found!");
  log("\nPlease create .env.local with:");
  log("   DATABASE_URL=postgresql://...");
  log("   NEXTAUTH_SECRET=your-secret");
  log("   NEXTAUTH_URL=http://localhost:3000\n");
  process.exit(1);
}

// Run seed
seed();
