import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reports = await prisma.jobReport.findMany({
      include: {
        job: {
          include: { client: true },
        },
      },
      orderBy: { generatedAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Reports fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
