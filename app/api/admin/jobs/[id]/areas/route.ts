import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UpdateAreasSchema = z.object({
  areas: z.array(z.object({
    id: z.string().optional(), // existing area id
    name: z.string().min(1, "Nama area wajib diisi"),
    items: z.array(z.object({
      id: z.string().optional(), // existing item id
      label: z.string().min(1, "Label tugas wajib diisi"),
    })),
  })),
});

export async function PUT(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { areas } = UpdateAreasSchema.parse(body);

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get existing areas for this job
    const existingAreas = await prisma.jobArea.findMany({
      where: { jobId: id },
      include: { items: true },
    });

    // Track which existing areas/items to keep
    const existingAreaIds = new Set(areas.filter(a => a.id).map(a => a.id));
    const existingItemIds = new Set(areas.flatMap(a => a.items.filter(i => i.id).map(i => i.id)));

    // Delete areas/items that are no longer in the update
    for (const area of existingAreas) {
      if (!existingAreaIds.has(area.id)) {
        // Delete entire area (cascade deletes items)
        await prisma.jobArea.delete({ where: { id: area.id } });
      } else {
        // Delete items not in update
        for (const item of area.items) {
          if (!existingItemIds.has(item.id)) {
            await prisma.checklistItem.delete({ where: { id: item.id } });
          }
        }
      }
    }

    // Update or create areas
    for (let i = 0; i < areas.length; i++) {
      const areaData = areas[i];

      if (areaData.id && existingAreaIds.has(areaData.id)) {
        // Update existing area
        await prisma.jobArea.update({
          where: { id: areaData.id },
          data: { name: areaData.name, sortOrder: i },
        });

        // Update or create items
        for (let j = 0; j < areaData.items.length; j++) {
          const itemData = areaData.items[j];

          if (itemData.id && existingItemIds.has(itemData.id)) {
            // Update existing item
            await prisma.checklistItem.update({
              where: { id: itemData.id },
              data: { label: itemData.label },
            });
          } else {
            // Create new item
            await prisma.checklistItem.create({
              data: {
                areaId: areaData.id,
                label: itemData.label,
              },
            });
          }
        }
      } else {
        // Create new area with items
        await prisma.jobArea.create({
          data: {
            jobId: id,
            name: areaData.name,
            sortOrder: i,
            items: {
              create: areaData.items.map((item) => ({
                label: item.label,
              })),
            },
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Update areas error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
