import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const authedHandler = auth(async function GET(req) {
  const session = req as never as { user?: { id?: string; role?: string } };
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user: session.user });
});

export const getAuthSession = auth;