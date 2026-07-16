import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Zod validation schema
const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").optional(),
  phone: z.string().min(1, "Nomor telepon wajib diisi").optional(),
  email: z.string().email("Format email tidak valid").optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

/**
 * GET /api/profile
 * Get current user profile
 */
export async function GET() {
  try {
    const session = await auth();

    console.log("Session:", JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized", session: session }, { status: 401 });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    console.log("Worker lookup with id:", session.user.id);
    console.log("Worker result:", worker);

    if (!worker) {
      return NextResponse.json({ error: "User not found", userId: session.user.id }, { status: 404 });
    }

    return NextResponse.json(worker);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update current user profile
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateProfileSchema.parse(body);

    const updateData: { name?: string; phone?: string; email?: string } = {};

    if (validated.name) updateData.name = validated.name;
    if (validated.phone) updateData.phone = validated.phone;
    if (validated.email) updateData.email = validated.email;

    const worker = await prisma.worker.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json(worker);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

/**
 * POST /api/profile/change-password
 * Change current user password
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(body);

    // Get current worker with password hash
    const worker = await prisma.worker.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!worker) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, worker.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.worker.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({ success: true, message: "Password berhasil diubah" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    console.error("Change password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
