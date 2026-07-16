import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod validation schema for template creation
const CreateTemplateSchema = z.object({
  name: z.string().min(1, "Nama template wajib diisi").max(200),
  description: z.string().max(500).optional(),
  areas: z.array(z.object({
    name: z.string().min(1, "Nama area wajib diisi").max(100),
    items: z.array(z.object({
      label: z.string().min(1).max(200),
    })),
  })).min(1, "Minimal 1 area wajib ditambahkan"),
});

// GET /api/admin/templates - List all templates
export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.jobTemplate.findMany({
    include: {
      areas: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(templates);
}

// POST /api/admin/templates - Create new template
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = CreateTemplateSchema.parse(body);

    const template = await prisma.jobTemplate.create({
      data: {
        name: validated.name,
        description: validated.description,
        createdBy: session.user.id,
        areas: {
          create: validated.areas.map((area, areaIdx) => ({
            name: area.name,
            sortOrder: areaIdx,
            items: {
              create: area.items.map((item, itemIdx) => ({
                label: item.label,
                sortOrder: itemIdx,
              })),
            },
          })),
        },
      },
      include: {
        areas: {
          include: { items: true },
        },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Create template error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
