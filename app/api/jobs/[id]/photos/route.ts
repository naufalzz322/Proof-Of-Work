import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToSupabase } from "@/lib/storage";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const areaId = formData.get("areaId") as string;
  const type = formData.get("type") as string;

  if (!file || !areaId || !type) {
    return NextResponse.json({ error: "file, areaId, type wajib diisi" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "jpg";
  const timestamp = Date.now();
  const storagePath = `photos/${areaId}/${timestamp}.${ext}`;

  let url: string;

  try {
    url = await uploadToSupabase(buffer, "job-photos", storagePath, file.type);
  } catch (err) {
    console.warn("Supabase storage unavailable, falling back to base64:", err);
    const base64 = buffer.toString("base64");
    url = `data:${file.type};base64,${base64}`;
  }

  const photo = await prisma.areaPhoto.create({
    data: {
      areaId,
      type: type as "BEFORE" | "AFTER",
      url,
      takenAt: new Date(),
      uploadedBy: session.user.id,
    },
  });

  return NextResponse.json({ id: photo.id, url: photo.url });
}
