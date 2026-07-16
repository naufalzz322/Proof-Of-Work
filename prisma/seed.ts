import { PrismaClient, WorkerRole, JobStatus, PhotoType, RecurrenceType, NotificationType, NotificationChannel } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[()]/g, " ")
      .replace(/['']/g, "")
      .replace(/[.,\/#!$%^&*;:{}=\_`~()]/g, " ")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

const prisma = new PrismaClient();

// Check for command flags
const args = process.argv.slice(2);
const isCleanOnly = args.includes("--clean");
const isReseed = args.includes("--reseed") || args.includes("--fresh");
const isIncremental = args.includes("--incremental") || args.includes("--upsert") || (!isCleanOnly && !isReseed);

async function cleanDatabase() {
  console.log("🧹 Cleaning database...\n");

  // Clean existing data (in correct order due to foreign keys)
  await prisma.adminNotification.deleteMany();
  await prisma.recurringSchedule.deleteMany();
  await prisma.jobTemplate.deleteMany();
  await prisma.jobReport.deleteMany();
  await prisma.clientSignature.deleteMany();
  await prisma.areaPhoto.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.workSession.deleteMany();
  await prisma.jobArea.deleteMany();
  await prisma.job.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.client.deleteMany();

  console.log("  ✓ All data cleared");
  console.log("\n✅ Database cleaned successfully!");
}

async function seedDatabase() {
  console.log("🌱 Seeding database with comprehensive demo data...");
  console.log("   Covering ALL conditions: jobs, workers, templates, recurring, notifications");

  // Clean existing data (in correct order due to foreign keys)
  await prisma.adminNotification.deleteMany();
  await prisma.recurringSchedule.deleteMany();
  await prisma.jobTemplate.deleteMany();
  await prisma.jobReport.deleteMany();
  await prisma.clientSignature.deleteMany();
  await prisma.areaPhoto.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.workSession.deleteMany();
  await prisma.jobArea.deleteMany();
  await prisma.job.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.client.deleteMany();

  console.log("  ✓ Cleared existing data");

  // ========================================
  // WORKERS
  // ========================================
  const adminHash = await bcrypt.hash("admin123", 10);
  const fieldHash = await bcrypt.hash("field123", 10);

  const admin = await prisma.worker.create({
    data: {
      name: "Dewi Lestari",
      email: "admin@pytagotech.com",
      passwordHash: adminHash,
      phone: "082139023218",
      role: WorkerRole.ADMIN,
    },
  });

  const supervisor = await prisma.worker.create({
    data: {
      name: "Ahmad Rizki",
      email: "supervisor@pytagotech.com",
      passwordHash: adminHash,
      phone: "082139023218",
      role: WorkerRole.SUPERVISOR,
    },
  });

  const fieldWorkers = await Promise.all([
    prisma.worker.create({ data: { name: "Budi Santoso", email: "budi@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Siti Aminah", email: "siti@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Joko Wijaya", email: "joko@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Ratna Sari", email: "ratna@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Dian Pratama", email: "dian@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Eko Susilo", email: "eko@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Fitri Handayani", email: "fitri@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Gunawan Hidayat", email: "gunawan@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Wati Rohmah", email: "wati@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Asep Sukmana", email: "asep@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Nina Kusuma", email: "nina@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Dedi Kurniawan", email: "dedi@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Lisa Permatasari", email: "lisa@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Bayu Pratama", email: "bayu@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Rudi Hermawan", email: "rudi@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Sari Wulandari", email: "sari@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
    prisma.worker.create({ data: { name: "Tono Saputra", email: "tono@field.com", passwordHash: fieldHash, phone: "082139023218", role: WorkerRole.FIELD } }),
  ]);

  console.log(`  ✓ Created 1 admin, 1 supervisor, ${fieldWorkers.length} field workers`);

  // ========================================
  // CLIENTS
  // ========================================
  const clients = await Promise.all([
    prisma.client.create({ data: { slug: "pytagotech", name: "Pytagotech Indonesia", contactName: "Tim Pytagotech", contactTitle: "Developer Team", contactPhone: "021-8765-4321", contactEmail: "info.pytagotech@gmail.com", address: "Jl. Sudirman No. 88, Jakarta 10220" } }),
    prisma.client.create({ data: { slug: "pt-maju-bersama-indonesia", name: "PT Maju Bersama Indonesia", contactName: "Dr. Hendra Kusuma", contactTitle: "Facility Manager", contactPhone: "021-5789-1234", contactEmail: "hendra.kusuma@majubersama.co.id", address: "Jl. HR Rasuna Said Kav. C-17, Kuningan, Jakarta Selatan 12940" } }),
    prisma.client.create({ data: { slug: "pt-cerdas-digital-indonesia", name: "PT Cerdas Digital Indonesia", contactName: "Rina Marlina", contactTitle: "HR Director", contactPhone: "031-5789-5678", contactEmail: "rina.marlina@cerdasdigital.id", address: "Jl. Surabaya No. 88, Gubeng, Surabaya 60272" } }),
    prisma.client.create({ data: { slug: "hotel-bintang-timur", name: "Hotel Bintang Timur", contactName: "Darmawan Hidayat", contactTitle: "Operations Manager", contactPhone: "022-7568-9012", contactEmail: "darmawan@hotelbintangtimur.co.id", address: "Jl. Merdeka No. 10, Braga, Bandung 40111" } }),
    prisma.client.create({ data: { slug: "universitas-harvest-jaya", name: "Universitas Harvest Jaya", contactName: "Prof. Dr. Hadi Wijanto", contactTitle: "Rektor", contactPhone: "0274-8901-2345", contactEmail: "rektorat@harvestjaya.ac.id", address: "Jl. Kaliurang Km 14, Sleman, Yogyakarta 55581" } }),
    prisma.client.create({ data: { slug: "pt-nusantara-propertindo", name: "PT Nusantara Propertindo", contactName: "Mira Andriani", contactTitle: "General Manager", contactPhone: "061-8901-2345", contactEmail: "gm@nusantaraproperti.co.id", address: "Jl. Imam Bonjol No. 55, Medan 20112" } }),
    prisma.client.create({ data: { slug: "apartemen-green-hills", name: "Apartemen Green Hills", contactName: "Taufik Ismail", contactTitle: "Building Manager", contactPhone: "021-6789-0123", contactEmail: "taufik@greenhills.co.id", address: "Jl. Sudirman No. 45, Senayan, Jakarta 12190" } }),
    prisma.client.create({ data: { slug: "rs-permata-harapan", name: "RS Permata Harapan", contactName: "dr. Anwar Hassan", contactTitle: "Directeur", contactPhone: "024-7654-3210", contactEmail: "anwar@rspermata.co.id", address: "Jl. Ahmad Yani No. 88, Semarang 50242" } }),
    prisma.client.create({ data: { slug: "pt-energi-bersih-indonesia", name: "PT Energi Bersih Indonesia", contactName: "Sari Dewi", contactTitle: "Admin Manager", contactPhone: "022-9876-5432", contactEmail: "sari@energebenih.id", address: "Jl. Ganesha No. 12, Lembang, Bandung 40391" } }),
  ]);

  console.log(`  ✓ Created ${clients.length} clients`);

  // ========================================
  // TEMPLATES
  // ========================================
  await prisma.jobTemplate.create({
    data: {
      name: "Pembersihan Kantor Standard",
      description: "Template standard untuk pembersihan kantor harian",
      areas: {
        create: [
          { name: "Lobby & Reception", sortOrder: 0, items: { create: [{ label: "Lantai disapu bersih", sortOrder: 0 }, { label: "Lantai dipel dengan disinfektan", sortOrder: 1 }, { label: "Meja resepsionis dilap", sortOrder: 2 }, { label: "Sofa dibersihkan", sortOrder: 3 }, { label: "Sampah dibuang", sortOrder: 4 }] } },
          { name: "Ruang Kerja", sortOrder: 1, items: { create: [{ label: "Lantai disapu", sortOrder: 0 }, { label: "Lantai dipel", sortOrder: 1 }, { label: "Meja kerja dilap debu", sortOrder: 2 }, { label: "Sampah dibuang", sortOrder: 3 }] } },
          { name: "Toilet", sortOrder: 2, items: { create: [{ label: "Lantai disapu & dipel", sortOrder: 0 }, { label: "Toilet disikat & disanitasi", sortOrder: 1 }, { label: "Cermin dicuci", sortOrder: 2 }, { label: "Pewangi disemprot", sortOrder: 3 }, { label: "Sampah dibuang", sortOrder: 4 }] } },
        ],
      },
    },
  });

  await prisma.jobTemplate.create({
    data: {
      name: "Deep Cleaning Kamar Hotel",
      description: "Template deep cleaning untuk kamar hotel setelah tamu checkout",
      areas: {
        create: [
          { name: "Kamar Tidur", sortOrder: 0, items: { create: [{ label: "Kasur dirapikan dan dilap", sortOrder: 0 }, { label: "Sprei diganti dengan yang baru", sortOrder: 1 }, { label: "Bantal dirapikan", sortOrder: 2 }, { label: "Lantai disapu bersih", sortOrder: 3 }, { label: "Lantai dipel", sortOrder: 4 }, { label: "Debu di furnitur dilap", sortOrder: 5 }] } },
          { name: "Kamar Mandi", sortOrder: 1, items: { create: [{ label: "Toilet disikat dan disanitasi", sortOrder: 0 }, { label: "Shower dibersihkan", sortOrder: 1 }, { label: "Cermin dicuci", sortOrder: 2 }, { label: "Lantai dipel dengan disinfektan", sortOrder: 3 }, { label: "Handuk diganti", sortOrder: 4 }, { label: "Amenities dirapikan", sortOrder: 5 }] } },
          { name: "Lobby Koridor", sortOrder: 2, items: { create: [{ label: "Karpet vacuum", sortOrder: 0 }, { label: "Lantai dipel", sortOrder: 1 }, { label: "Reling dibersihkan", sortOrder: 2 }] } },
        ],
      },
    },
  });

  await prisma.jobTemplate.create({
    data: {
      name: "Cleaning Apartemen Studio",
      description: "Template pembersihan untuk apartemen tipe studio",
      areas: {
        create: [
          { name: "Ruang Tamu & Kamar Tidur", sortOrder: 0, items: { create: [{ label: "Lantai disapu dan dipel", sortOrder: 0 }, { label: "Debu di meja dan rak dilap", sortOrder: 1 }, { label: "Sofa dilap", sortOrder: 2 }, { label: "AC difilter dibersihkan", sortOrder: 3 }] } },
          { name: "Dapur", sortOrder: 1, items: { create: [{ label: "Wastafel dibersihkan", sortOrder: 0 }, { label: "Counter dilap", sortOrder: 1 }, { label: "Kompor dibersihkan", sortOrder: 2 }, { label: "Sampah dibuang", sortOrder: 3 }] } },
          { name: "Kamar Mandi", sortOrder: 2, items: { create: [{ label: "Toilet dibersihkan", sortOrder: 0 }, { label: "Shower area dibersihkan", sortOrder: 1 }, { label: "Lantai dipel", sortOrder: 2 }, { label: "Ventilasi dibersihkan", sortOrder: 3 }] } },
        ],
      },
    },
  });

  await prisma.jobTemplate.create({
    data: {
      name: "Pembersihan Ruang Rawat Inap",
      description: "Template khusus untuk ruang rawat inap rumah sakit (sterilisasi)",
      areas: {
        create: [
          { name: "Ruang Pasien", sortOrder: 0, items: { create: [{ label: "Lantai disapu", sortOrder: 0 }, { label: "Lantai dipel dengan disinfektan medis", sortOrder: 1 }, { label: "Overbed table dibersihkan", sortOrder: 2 }, { label: "AC unit dibersihkan", sortOrder: 3 }, { label: "Jendela dibersihkan", sortOrder: 4 }] } },
          { name: "Kamar Mandi Pasien", sortOrder: 1, items: { create: [{ label: "Toilet disanitasi dengan bleach", sortOrder: 0 }, { label: "Lantai dipel dengan disinfektan", sortOrder: 1 }, { label: "Grab bar dibersihkan", sortOrder: 2 }] } },
          { name: "Koridor", sortOrder: 2, items: { create: [{ label: "Lantai disapu dan dipel", sortOrder: 0 }, { label: "Reling disanitasi", sortOrder: 1 }, { label: "Sampah medis dibuang dengan benar", sortOrder: 2 }] } },
        ],
      },
    },
  });

  console.log("  ✓ Created 4 job templates");

  // ========================================
  // RECURRING SCHEDULES
  // ========================================
  await Promise.all([
    prisma.recurringSchedule.create({ data: { clientId: clients[0].id, title: "Pembersihan Rutin Harian - {date}", locationAddress: "Jl. HR Rasuna Said Kav. C-17, Kuningan, Jakarta Selatan", locationLat: -6.2297, locationLng: 106.8301, locationRadius: 200, scheduledTime: "08:00", recurrence: RecurrenceType.DAILY, notes: "Tim 3 orang.", isActive: true } }),
    prisma.recurringSchedule.create({ data: { clientId: clients[2].id, title: "Deep Cleaning Kamar Hotel - {date}", locationAddress: "Jl. Merdeka No. 10, Braga, Bandung", locationLat: -6.9175, locationLng: 107.6191, locationRadius: 200, scheduledTime: "09:00", recurrence: RecurrenceType.WEEKLY, daysOfWeek: [1, 3, 5], notes: "Mulai setelah checkout.", isActive: true } }),
    prisma.recurringSchedule.create({ data: { clientId: clients[3].id, title: "Pembersihan Menyeluruh Gedung A - {date}", locationAddress: "Jl. Kaliurang Km 14, Sleman, Yogyakarta", locationLat: -7.7628, locationLng: 110.3789, locationRadius: 200, scheduledTime: "07:00", recurrence: RecurrenceType.MONTHLY, dayOfMonth: 1, endDate: new Date("2027-01-01"), notes: "Gedung dikosongkan.", isActive: true } }),
    prisma.recurringSchedule.create({ data: { clientId: clients[5].id, title: "Cleaning Lobby & Area Umum - {date}", locationAddress: "Jl. Sudirman No. 45, Senayan, Jakarta", locationLat: -6.1937, locationLng: 106.8229, locationRadius: 200, scheduledTime: "06:00", recurrence: RecurrenceType.WEEKLY, daysOfWeek: [2, 4], notes: "Sebelum warga bangun.", isActive: true } }),
    prisma.recurringSchedule.create({ data: { clientId: clients[4].id, title: "Pembersihan Mingguan Medan - {date}", locationAddress: "Jl. Imam Bonjol No. 55, Medan", locationLat: 3.5881, locationLng: 98.6728, locationRadius: 200, scheduledTime: "08:00", recurrence: RecurrenceType.WEEKLY, daysOfWeek: [6], notes: "Paused.", isActive: false } }),
  ]);

  console.log("  ✓ Created 5 recurring schedules");

  // ========================================
  // CREATE JOBS
  // ========================================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  async function createJob(data: {
    jobNumber: string;
    clientId: string;
    title: string;
    description: string;
    locationAddress: string;
    locationLat: number;
    locationLng: number;
    scheduledDate: Date;
    scheduledTime: string;
    status: JobStatus;
    notes?: string;
    areas: { name: string; items: { label: string; isDone?: boolean }[] }[];
    workerIds: string[];
    signature?: { signerName: string; signerTitle: string; signedAt: Date };
    hasReport?: boolean;
    reportSent?: boolean;
    reportSentToEmail?: string;
    notifications?: { type: NotificationType; title: string; message: string }[];
  }) {
    const job = await prisma.job.create({
      data: {
        slug: data.jobNumber,
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
          create: data.areas.map((area, areaIdx) => ({
            name: area.name,
            sortOrder: areaIdx,
            items: {
              create: area.items.map((item) => ({
                label: item.label,
                isDone: item.isDone ?? false,
                doneAt: item.isDone ? data.scheduledDate : null,
              })),
            },
          })),
        },
      },
      include: { areas: { include: { items: true } } },
    });

    for (const workerId of data.workerIds) {
      const hasCheckIn = data.status !== "DRAFT" && data.status !== "ASSIGNED";
      const checkInTime = hasCheckIn ? new Date(data.scheduledDate) : null;
      if (checkInTime) {
        const [hours, minutes] = data.scheduledTime.split(":").map(Number);
        checkInTime.setHours(hours || 8, minutes + 5, 0, 0);
      }
      await prisma.workSession.create({ data: { jobId: job.id, workerId, checkInAt: checkInTime, checkInLat: hasCheckIn ? data.locationLat : null, checkInLng: hasCheckIn ? data.locationLng : null } });
    }

    if (data.signature) {
      await prisma.clientSignature.create({ data: { jobId: job.id, signatureUrl: "/signatures/demo-signature.svg", signerName: data.signature.signerName, signerTitle: data.signature.signerTitle, signedAt: data.signature.signedAt } });
    }

    if (["COMPLETED", "INVOICED"].includes(data.status) && data.workerIds.length > 0) {
      const workerId = data.workerIds[0];
      for (const area of job.areas) {
        const photoCount = area.items.length > 3 ? 2 : 1;
        for (let i = 0; i < photoCount; i++) {
          await prisma.areaPhoto.create({ data: { areaId: area.id, type: i === 0 ? "BEFORE" : "AFTER", url: "/photos/demo-placeholder.svg", takenAt: new Date(data.scheduledDate.getTime() + (i + 1) * 60 * 60 * 1000), uploadedBy: workerId } });
        }
      }
    }

    if (data.hasReport) {
      const reportTime = new Date(data.scheduledDate);
      reportTime.setHours(17, 0, 0, 0);
      await prisma.jobReport.create({ data: { jobId: job.id, pdfUrl: `/reports/${job.jobNumber}.pdf`, generatedAt: reportTime, sentAt: data.reportSent ? new Date(reportTime.getTime() + 30 * 60 * 1000) : null, sentToEmail: data.reportSentToEmail } });
    }

    if (data.notifications) {
      for (const notif of data.notifications) {
        await prisma.adminNotification.create({ data: { type: notif.type, title: notif.title, message: notif.message, jobId: job.id, jobSlug: job.slug, jobNumber: job.jobNumber, sentVia: [NotificationChannel.WHATSAPP, NotificationChannel.IN_APP] } });
      }
    }

    return job;
  }

  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 5);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const threeDaysAgo = new Date(today); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
  const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const overdueDate = new Date(today); overdueDate.setHours(10, 0, 0, 0);

  await createJob({ jobNumber: "LAP-20260708-001", clientId: clients[3].id, title: "Pembersihan gedung B - Universitas", description: "Pembersihan gedung B menjelang semester baru", locationAddress: "Jl. Kaliurang Km 14, Sleman, Yogyakarta", locationLat: -7.7628, locationLng: 110.3789, scheduledDate: nextWeek, scheduledTime: "08:00", status: JobStatus.DRAFT, notes: "Draft - menunggu approval", areas: [{ name: "Lobby Utama", items: [{ label: "Lantai disapu", isDone: false }, { label: "Lantai dipel", isDone: false }, { label: "Kaca dibersihkan", isDone: false }] }], workerIds: [] });

  await createJob({ jobNumber: "LAP-20260703-001", clientId: clients[2].id, title: "Deep Cleaning Kamar Hotel 10 Unit", description: "Deep cleaning kamar hotel", locationAddress: "Jl. Merdeka No. 10, Braga, Bandung", locationLat: -6.9175, locationLng: 107.6191, scheduledDate: tomorrow, scheduledTime: "13:00", status: JobStatus.ASSIGNED, notes: "Check-in jam 13:00", areas: [{ name: "Kamar 101-105", items: [{ label: "Kasur dirapikan", isDone: false }, { label: "Lantai disapu", isDone: false }, { label: "Kamar mandi dibersihkan", isDone: false }] }], workerIds: [fieldWorkers[2].id, fieldWorkers[3].id, fieldWorkers[7].id] });

  await createJob({ jobNumber: "LAP-20260702-001", clientId: clients[1].id, title: "Pembersihan Area Produksi & Gudang", description: "Deep cleaning", locationAddress: "Jl. Surabaya No. 88, Gubeng, Surabaya", locationLat: -7.2575, locationLng: 112.7521, scheduledDate: today, scheduledTime: "07:30", status: JobStatus.IN_PROGRESS, notes: "APD lengkap", areas: [{ name: "Area Produksi Utama", items: [{ label: "Lantai disapu", isDone: true }, { label: "Lantai dipel", isDone: true }, { label: "Mesin dilap", isDone: false }] }, { name: "Gudang", items: [{ label: "Lantai disapu", isDone: true }, { label: "Lantai dipel", isDone: false }] }], workerIds: [fieldWorkers[0].id, fieldWorkers[1].id], notifications: [{ type: NotificationType.WORKER_CHECKIN, title: "Worker Check-in", message: `Budi dan Siti check-in di ${clients[1].name}` }] });

  await createJob({ jobNumber: "LAP-20260702-002", clientId: clients[5].id, title: "Cleaning Mingguan Lobby Apartemen", description: "Pembersihan lobby", locationAddress: "Jl. Sudirman No. 45, Jakarta", locationLat: -6.1937, locationLng: 106.8229, scheduledDate: today, scheduledTime: "06:00", status: JobStatus.IN_PROGRESS, areas: [{ name: "Lobby Utama", items: [{ label: "Lantai disapu", isDone: true }, { label: "Sofa dibersihkan", isDone: true }, { label: "Meja dilap", isDone: false }] }], workerIds: [fieldWorkers[6].id], notifications: [{ type: NotificationType.WORKER_CHECKIN, title: "Worker Check-in", message: `Fitri check-in di ${clients[5].name}` }] });

  await createJob({ jobNumber: "LAP-20260701-001", clientId: clients[0].id, title: "Pembersihan Rutin Gedung Kantor Lt. 3 & 4", description: "Pembersihan lantai", locationAddress: "Jl. HR Rasuna Said, Jakarta", locationLat: -6.2297, locationLng: 106.8301, scheduledDate: yesterday, scheduledTime: "08:00", status: JobStatus.COMPLETED, notes: "Lift khusus barang", areas: [{ name: "Lobby Lt. 3", items: [{ label: "Lantai disapu", isDone: true }, { label: "Lantai dipel", isDone: true }, { label: "Sampah dibuang", isDone: true }] }], workerIds: [fieldWorkers[0].id, fieldWorkers[1].id], signature: { signerName: "Dr. Hendra Kusuma", signerTitle: "Facility Manager", signedAt: new Date(yesterday.getTime() + 5 * 60 * 60 * 1000) }, hasReport: true, reportSent: true, reportSentToEmail: "hendra.kusuma@majubersama.co.id", notifications: [{ type: NotificationType.WORKER_CHECKIN, title: "Worker Check-in", message: "Workers check-in" }, { type: NotificationType.CLIENT_SIGNED, title: "Client Signed", message: "Signed" }, { type: NotificationType.JOB_COMPLETED, title: "Job Completed", message: "Selesai" }, { type: NotificationType.REPORT_SENT, title: "Report Sent", message: "PDF dikirim" }] });

  await createJob({ jobNumber: "LAP-20260629-001", clientId: clients[4].id, title: "Pembersihan Routine Kantor Medan", description: "Pembersihan kantor", locationAddress: "Jl. Imam Bonjol No. 55, Medan", locationLat: 3.5881, locationLng: 98.6728, scheduledDate: threeDaysAgo, scheduledTime: "08:00", status: JobStatus.COMPLETED, areas: [{ name: "Lobby", items: [{ label: "Lantai disapu", isDone: true }, { label: "Meja dilap", isDone: true }] }], workerIds: [fieldWorkers[2].id], signature: { signerName: "Mira Andriani", signerTitle: "General Manager", signedAt: new Date(threeDaysAgo.getTime() + 4 * 60 * 60 * 1000) }, hasReport: true, reportSent: false });

  await createJob({ jobNumber: "LAP-20260625-001", clientId: clients[6].id, title: "Pembersihan Ruang Rawat Inap Lt. 2", description: "Sanitasi RS", locationAddress: "Jl. Ahmad Yani No. 88, Semarang", locationLat: -6.9925, locationLng: 110.4205, scheduledDate: lastWeek, scheduledTime: "06:00", status: JobStatus.INVOICED, notes: "Protokol RS", areas: [{ name: "Ruang Pasien", items: [{ label: "Lantai disapu", isDone: true }, { label: "Disinfektan medis", isDone: true }] }], workerIds: [fieldWorkers[3].id, fieldWorkers[4].id], signature: { signerName: "dr. Anwar Hassan", signerTitle: "Directeur", signedAt: new Date(lastWeek.getTime() + 4 * 60 * 60 * 1000) }, hasReport: true, reportSent: true, reportSentToEmail: "anwar@rspermata.co.id" });

  await createJob({ jobNumber: "LAP-20260702-003", clientId: clients[7].id, title: "Pembersihan Kantin & Area Makan", description: "Kantin karyawan", locationAddress: "Jl. Ganesha No. 12, Lembang, Bandung", locationLat: -6.8116, locationLng: 107.6077, scheduledDate: overdueDate, scheduledTime: "10:00", status: JobStatus.ASSIGNED, notes: "Belum datang", areas: [{ name: "Kantin Utama", items: [{ label: "Lantai disapu", isDone: false }, { label: "Meja dilap", isDone: false }] }], workerIds: [fieldWorkers[5].id], notifications: [{ type: NotificationType.JOB_OVERDUE, title: "Job Overdue", message: "Sudah melewati jadwal" }] });

  await createJob({ jobNumber: "LAP-20260630-001", clientId: clients[2].id, title: "Cleaning Pool Area & Gym Hotel", description: "Pool & gym", locationAddress: "Jl. Merdeka No. 10, Bandung", locationLat: -6.9175, locationLng: 107.6191, scheduledDate: twoDaysAgo, scheduledTime: "06:00", status: JobStatus.COMPLETED, notes: "Sebelum tamu datang", areas: [{ name: "Kolam Renang", items: [{ label: "Deck dibersihkan", isDone: true }, { label: "Kursi dilap", isDone: true }] }], workerIds: [fieldWorkers[2].id, fieldWorkers[3].id, fieldWorkers[6].id], signature: { signerName: "Darmawan Hidayat", signerTitle: "Operations Manager", signedAt: new Date(twoDaysAgo.getTime() + 3 * 60 * 60 * 1000) }, hasReport: true, reportSent: true, reportSentToEmail: "darmawan@hotelbintangtimur.co.id" });

  // Unread notifications
  await prisma.adminNotification.create({ data: { type: NotificationType.JOB_OVERDUE, title: "Job Overdue Alert", message: "Job LAP-20260702-003 sudah 2 jam melewati jadwal", jobId: "demo", jobSlug: "LAP-20260702-003", jobNumber: "LAP-20260702-003", seenBy: [], sentVia: [NotificationChannel.WHATSAPP, NotificationChannel.IN_APP] } });
  await prisma.adminNotification.create({ data: { type: NotificationType.WORKER_CHECKIN, title: "Worker Morning Check-in", message: "3 workers checked in for today's jobs", seenBy: [], sentVia: [NotificationChannel.IN_APP] } });

  console.log("  ✓ Created 9 jobs with all data");
  console.log("\n✅ FULL SEED COMPLETED");
}

// ========================================
// INCREMENTAL SEED
// ========================================
async function incrementalSeed() {
  console.log("🔄 Incremental seed — adding missing data...\n");

  const adminHash = await bcrypt.hash("admin123", 10);
  const fieldHash = await bcrypt.hash("field123", 10);

  // Get existing data first
  const existingWorkers = await prisma.worker.findMany();
  const existingClients = await prisma.client.findMany();
  const existingJobs = await prisma.job.count();

  // Workers
  const workerSeeds = [
    { name: "Dewi Lestari", email: "admin@pytagotech.com", phone: "082139023218", role: WorkerRole.ADMIN },
    { name: "Ahmad Rizki", email: "supervisor@pytagotech.com", phone: "082139023218", role: WorkerRole.SUPERVISOR },
    { name: "Budi Santoso", email: "budi@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Siti Aminah", email: "siti@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Joko Wijaya", email: "joko@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Ratna Sari", email: "ratna@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Dian Pratama", email: "dian@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Eko Susilo", email: "eko@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Fitri Handayani", email: "fitri@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Gunawan Hidayat", email: "gunawan@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Wati Rohmah", email: "wati@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Asep Sukmana", email: "asep@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Nina Kusuma", email: "nina@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Dedi Kurniawan", email: "dedi@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Lisa Permatasari", email: "lisa@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Bayu Pratama", email: "bayu@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Rudi Hermawan", email: "rudi@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Sari Wulandari", email: "sari@field.com", phone: "082139023218", role: WorkerRole.FIELD },
    { name: "Tono Saputra", email: "tono@field.com", phone: "082139023218", role: WorkerRole.FIELD },
  ];

  for (const w of workerSeeds) {
    const existing = existingWorkers.find((ew) => ew.email === w.email);
    if (!existing) {
      await prisma.worker.create({ data: { ...w, passwordHash: w.role === WorkerRole.FIELD ? fieldHash : adminHash } });
    }
  }
  console.log(`  ✓ Workers: ${existingWorkers.length}/${workerSeeds.length} exist`);

  // Clients
  const clientSeeds = [
    { slug: "pytagotech", name: "Pytagotech Indonesia", contactName: "Tim Pytagotech", contactTitle: "Developer Team", contactPhone: "021-8765-4321", contactEmail: "info.pytagotech@gmail.com", address: "Jl. Sudirman No. 88, Jakarta 10220" },
    { slug: "pt-maju-bersama-indonesia", name: "PT Maju Bersama Indonesia", contactName: "Dr. Hendra Kusuma", contactTitle: "Facility Manager", contactPhone: "021-5789-1234", contactEmail: "hendra.kusuma@majubersama.co.id", address: "Jl. HR Rasuna Said Kav. C-17, Kuningan, Jakarta Selatan 12940" },
    { slug: "pt-cerdas-digital-indonesia", name: "PT Cerdas Digital Indonesia", contactName: "Rina Marlina", contactTitle: "HR Director", contactPhone: "031-5789-5678", contactEmail: "rina.marlina@cerdasdigital.id", address: "Jl. Surabaya No. 88, Gubeng, Surabaya 60272" },
    { slug: "hotel-bintang-timur", name: "Hotel Bintang Timur", contactName: "Darmawan Hidayat", contactTitle: "Operations Manager", contactPhone: "022-7568-9012", contactEmail: "darmawan@hotelbintangtimur.co.id", address: "Jl. Merdeka No. 10, Braga, Bandung 40111" },
    { slug: "universitas-harvest-jaya", name: "Universitas Harvest Jaya", contactName: "Prof. Dr. Hadi Wijanto", contactTitle: "Rektor", contactPhone: "0274-8901-2345", contactEmail: "rektorat@harvestjaya.ac.id", address: "Jl. Kaliurang Km 14, Sleman, Yogyakarta 55581" },
    { slug: "pt-nusantara-propertindo", name: "PT Nusantara Propertindo", contactName: "Mira Andriani", contactTitle: "General Manager", contactPhone: "061-8901-2345", contactEmail: "gm@nusantaraproperti.co.id", address: "Jl. Imam Bonjol No. 55, Medan 20112" },
    { slug: "apartemen-green-hills", name: "Apartemen Green Hills", contactName: "Taufik Ismail", contactTitle: "Building Manager", contactPhone: "021-6789-0123", contactEmail: "taufik@greenhills.co.id", address: "Jl. Sudirman No. 45, Senayan, Jakarta 12190" },
    { slug: "rs-permata-harapan", name: "RS Permata Harapan", contactName: "dr. Anwar Hassan", contactTitle: "Directeur", contactPhone: "024-7654-3210", contactEmail: "anwar@rspermata.co.id", address: "Jl. Ahmad Yani No. 88, Semarang 50242" },
    { slug: "pt-energi-bersih-indonesia", name: "PT Energi Bersih Indonesia", contactName: "Sari Dewi", contactTitle: "Admin Manager", contactPhone: "022-9876-5432", contactEmail: "sari@energebenih.id", address: "Jl. Ganesha No. 12, Lembang, Bandung 40391" },
  ];

  for (const c of clientSeeds) {
    const existing = existingClients.find((ec) => ec.slug === c.slug);
    if (!existing) {
      await prisma.client.create({ data: c });
    }
  }
  console.log(`  ✓ Clients: ${existingClients.length}/${clientSeeds.length} exist`);

  // Templates
  const templateSeeds = ["Pembersihan Kantor Standard", "Deep Cleaning Kamar Hotel", "Cleaning Apartemen Studio", "Pembersihan Ruang Rawat Inap"];
  const existingTemplates = await prisma.jobTemplate.count();
  if (existingTemplates < 4) {
    console.log("  ⚠ Templates incomplete — run --reseed to recreate all");
  } else {
    console.log(`  ✓ Templates: ${existingTemplates}/4 exist`);
  }

  // Jobs — only if there are no jobs at all
  if (existingJobs === 0) {
    console.log("  ⚠ No jobs found — creating demo jobs...");
    // Re-fetch to get fresh IDs
    const freshWorkers = await prisma.worker.findMany();
    const freshClients = await prisma.client.findMany();

    if (freshWorkers.length > 0 && freshClients.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const getWorker = (email: string) => freshWorkers.find((w) => w.email === email);
      const getClient = (slug: string) => freshClients.find((c) => c.slug === slug);

      const Budi = getWorker("budi@field.com");
      const Siti = getWorker("siti@field.com");
      const Joko = getWorker("joko@field.com");
      const Ratna = getWorker("ratna@field.com");
      const Dian = getWorker("dian@field.com");
      const Eko = getWorker("eko@field.com");
      const Fitri = getWorker("fitri@field.com");
      const Gunawan = getWorker("gunawan@field.com");

      const PTMaju = getClient("pt-maju-bersama-indonesia");
      const PTCerdas = getClient("pt-cerdas-digital-indonesia");
      const HotelBintang = getClient("hotel-bintang-timur");
      const UnivHarvest = getClient("universitas-harvest-jaya");
      const PTNusantara = getClient("pt-nusantara-propertindo");
      const ApartemenGreen = getClient("apartemen-green-hills");
      const RSPermata = getClient("rs-permata-harapan");
      const PTEnergi = getClient("pt-energi-bersih-indonesia");
      const Pytagotech = getClient("pytagotech");

      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const overdueDate = new Date(today); overdueDate.setHours(10, 0, 0, 0);

      if (Budi && Siti && Joko && Ratna && Gunawan && Eko && Fitri && PTMaju && PTCerdas && HotelBintang && ApartemenGreen && PTEnergi) {
        // IN_PROGRESS jobs
        await prisma.job.create({ data: { slug: "LAP-20260702-001", jobNumber: "LAP-20260702-001", clientId: PTCerdas.id, title: "Pembersihan Area Produksi & Gudang", description: "Deep cleaning area produksi", locationAddress: "Jl. Surabaya No. 88, Gubeng, Surabaya", locationLat: -7.2575, locationLng: 112.7521, locationRadius: 200, scheduledDate: today, scheduledTime: "07:30", status: JobStatus.IN_PROGRESS, notes: "APD lengkap", areas: { create: [{ name: "Area Produksi", sortOrder: 0, items: { create: [{ label: "Lantai disapu", isDone: true }, { label: "Lantai dipel", isDone: true }, { label: "Mesin dilap", isDone: false }] } }] } } });
        await prisma.workSession.create({ data: { jobId: (await prisma.job.findFirst({ where: { jobNumber: "LAP-20260702-001" } }))!.id, workerId: Budi.id, checkInAt: today, checkInLat: -7.2575, checkInLng: 112.7521 } });
        await prisma.workSession.create({ data: { jobId: (await prisma.job.findFirst({ where: { jobNumber: "LAP-20260702-001" } }))!.id, workerId: Siti.id, checkInAt: today, checkInLat: -7.2575, checkInLng: 112.7521 } });

        await prisma.job.create({ data: { slug: "LAP-20260702-002", jobNumber: "LAP-20260702-002", clientId: ApartemenGreen.id, title: "Cleaning Lobby Apartemen", description: "Pembersihan lobby", locationAddress: "Jl. Sudirman No. 45, Jakarta", locationLat: -6.1937, locationLng: 106.8229, locationRadius: 200, scheduledDate: today, scheduledTime: "06:00", status: JobStatus.IN_PROGRESS, areas: { create: [{ name: "Lobby", sortOrder: 0, items: { create: [{ label: "Lantai disapu", isDone: true }, { label: "Sofa dibersihkan", isDone: true }] } }] } } });
        await prisma.workSession.create({ data: { jobId: (await prisma.job.findFirst({ where: { jobNumber: "LAP-20260702-002" } }))!.id, workerId: Fitri.id, checkInAt: today, checkInLat: -6.1937, checkInLng: 106.8229 } });

        // ASSIGNED jobs
        await prisma.job.create({ data: { slug: "LAP-20260703-001", jobNumber: "LAP-20260703-001", clientId: HotelBintang.id, title: "Deep Cleaning Kamar Hotel 10 Unit", description: "Deep cleaning kamar", locationAddress: "Jl. Merdeka No. 10, Braga, Bandung", locationLat: -6.9175, locationLng: 107.6191, locationRadius: 200, scheduledDate: tomorrow, scheduledTime: "13:00", status: JobStatus.ASSIGNED, areas: { create: [{ name: "Kamar 101-105", sortOrder: 0, items: { create: [{ label: "Kasur dirapikan", isDone: false }] } }] } } });
        await prisma.workSession.create({ data: { jobId: (await prisma.job.findFirst({ where: { jobNumber: "LAP-20260703-001" } }))!.id, workerId: Joko.id } });
        await prisma.workSession.create({ data: { jobId: (await prisma.job.findFirst({ where: { jobNumber: "LAP-20260703-001" } }))!.id, workerId: Ratna.id } });
        await prisma.workSession.create({ data: { jobId: (await prisma.job.findFirst({ where: { jobNumber: "LAP-20260703-001" } }))!.id, workerId: Gunawan.id } });

        // OVERDUE job
        await prisma.job.create({ data: { slug: "LAP-20260702-003", jobNumber: "LAP-20260702-003", clientId: PTEnergi.id, title: "Pembersihan Kantin", description: "Kantin karyawan", locationAddress: "Jl. Ganesha No. 12, Bandung", locationLat: -6.8116, locationLng: 107.6077, locationRadius: 200, scheduledDate: overdueDate, scheduledTime: "10:00", status: JobStatus.ASSIGNED, areas: { create: [{ name: "Kantin", sortOrder: 0, items: { create: [{ label: "Lantai disapu", isDone: false }] } }] } } });
        await prisma.workSession.create({ data: { jobId: (await prisma.job.findFirst({ where: { jobNumber: "LAP-20260702-003" } }))!.id, workerId: Eko.id } });
        await prisma.adminNotification.create({ data: { type: NotificationType.JOB_OVERDUE, title: "Job Overdue", message: "Sudah melewati jadwal", jobSlug: "LAP-20260702-003", jobNumber: "LAP-20260702-003", seenBy: [], sentVia: [NotificationChannel.WHATSAPP, NotificationChannel.IN_APP] } });

        // COMPLETED job
        await prisma.job.create({ data: { slug: "LAP-20260701-001", jobNumber: "LAP-20260701-001", clientId: PTMaju.id, title: "Pembersihan Gedung Kantor Lt. 3", description: "Pembersihan rutin", locationAddress: "Jl. HR Rasuna Said, Jakarta", locationLat: -6.2297, locationLng: 106.8301, locationRadius: 200, scheduledDate: yesterday, scheduledTime: "08:00", status: JobStatus.COMPLETED, areas: { create: [{ name: "Lobby", sortOrder: 0, items: { create: [{ label: "Lantai disapu", isDone: true }, { label: "Lantai dipel", isDone: true }] } }] } } });
        await prisma.workSession.create({ data: { jobId: (await prisma.job.findFirst({ where: { jobNumber: "LAP-20260701-001" } }))!.id, workerId: Budi.id, checkInAt: yesterday } });
        await prisma.workSession.create({ data: { jobId: (await prisma.job.findFirst({ where: { jobNumber: "LAP-20260701-001" } }))!.id, workerId: Siti.id, checkInAt: yesterday } });
        await prisma.clientSignature.create({ data: { jobId: (await prisma.job.findFirst({ where: { jobNumber: "LAP-20260701-001" } }))!.id, signatureUrl: "/signatures/demo-signature.svg", signerName: "Dr. Hendra Kusuma", signerTitle: "Facility Manager", signedAt: yesterday } });
        await prisma.jobReport.create({ data: { jobId: (await prisma.job.findFirst({ where: { jobNumber: "LAP-20260701-001" } }))!.id, pdfUrl: "/reports/LAP-20260701-001.pdf", generatedAt: yesterday, sentAt: yesterday, sentToEmail: "hendra.kusuma@majubersama.co.id" } });
        await prisma.adminNotification.create({ data: { type: NotificationType.JOB_COMPLETED, title: "Job Completed", message: "Selesai", jobSlug: "LAP-20260701-001", jobNumber: "LAP-20260701-001", seenBy: [], sentVia: [NotificationChannel.IN_APP] } });

        console.log("  ✓ Created demo jobs");
      }
    }
  } else {
    console.log(`  ✓ Jobs: ${existingJobs} exist`);
  }

  console.log("\n✅ INCREMENTAL SEED COMPLETED");
}

// Main execution
async function main() {
  try {
    await prisma.$connect();

    if (isCleanOnly) {
      await cleanDatabase();
    } else if (isReseed) {
      await seedDatabase();
    } else {
      await incrementalSeed();
    }
  } catch (e) {
    console.error("❌ Error:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
