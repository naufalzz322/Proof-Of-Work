import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId, isDone } = await req.json();

  if (!itemId) {
    return NextResponse.json({ error: "itemId wajib diisi" }, { status: 400 });
  }

  const item = await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      isDone,
      doneAt: isDone ? new Date() : null,
      doneBy: isDone ? session.user.id : null,
    },
  });

  return NextResponse.json(item);
}
