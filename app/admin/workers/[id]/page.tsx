export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import WorkerDetailClient from "./WorkerDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkerDetailPage({ params }: PageProps) {
  const { id } = await params;

  const worker = await prisma.worker.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  if (!worker) notFound();

  return <WorkerDetailClient worker={worker} />;
}
