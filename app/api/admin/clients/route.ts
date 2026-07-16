import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateUniqueClientSlug } from "@/lib/slug";

// Zod validation schema for client creation
const CreateClientSchema = z.object({
  name: z.string().min(1, "Nama klien wajib diisi").max(200, "Nama maksimal 200 karakter"),
  contactName: z.string().max(100).optional().default(""),
  contactTitle: z.string().max(100).optional().default(""),
  contactPhone: z.string().max(20).optional().default(""),
  contactEmail: z.string().email("Format email tidak valid").optional().or(z.literal("")).default(""),
  address: z.string().max(500).optional().default(""),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      contactName: true,
      contactTitle: true,
      contactPhone: true,
      contactEmail: true,
      address: true,
      _count: { select: { jobs: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate with Zod
    const validated = CreateClientSchema.parse(body);

    const slug = await generateUniqueClientSlug(validated.name, prisma);

    const client = await prisma.client.create({
      data: {
        slug,
        name: validated.name,
        contactName: validated.contactName,
        contactTitle: validated.contactTitle || null,
        contactPhone: validated.contactPhone,
        contactEmail: validated.contactEmail || null,
        address: validated.address,
      },
    });

    return NextResponse.json({ id: client.id, name: client.name }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
