import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Zod validation schema for template update
const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  areas: z.array(z.object({
    name: z.string().min(1).max(200),
    items: z.array(z.object({
      label: z.string().min(1).max(500),
    })),
  })).optional(),
});

// GET /api/admin/templates/[id] - Get single template
export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const template = await prisma.jobTemplate.findUnique({
    where: { id },
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
  });

  if (!template) {
    return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(template);
}

// PUT /api/admin/templates/[id] - Update template
export async function PUT(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const validated = UpdateTemplateSchema.parse(body);

    // Get existing template to check if areas are being updated
    const existing = await prisma.jobTemplate.findUnique({
      where: { id },
      include: { areas: { include: { items: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    // If areas are included in the update, replace all areas and items
    if (validated.areas) {
      // Delete all existing areas (cascades to items)
      await prisma.jobTemplateArea.deleteMany({
        where: { templateId: id },
      });

      // Create new areas with items
      for (let i = 0; i < validated.areas.length; i++) {
        const area = validated.areas[i];
        await prisma.jobTemplateArea.create({
          data: {
            templateId: id,
            name: area.name,
            sortOrder: i,
            items: {
              create: area.items.map((item, j) => ({
                label: item.label,
                sortOrder: j,
              })),
            },
          },
        });
      }
    }

    // Update basic fields
    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;

    const template = await prisma.jobTemplate.update({
      where: { id },
      data: updateData,
      include: {
        areas: {
          include: { items: true },
        },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Update template error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE /api/admin/templates/[id] - Delete template
export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.jobTemplate.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
  }
}
