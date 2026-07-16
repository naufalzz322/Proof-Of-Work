import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; areaId: string }> }
) {
  const { areaId } = await params;
  const area = await prisma.jobArea.findUnique({
    where: { id: areaId },
    include: { items: true, photos: true },
  });

  if (!area) {
    return NextResponse.json({ error: "Area not found" }, { status: 404 });
  }

  return NextResponse.json(area);
}
