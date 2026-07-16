export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SupervisorJobDetail from "./SupervisorJobDetail";
import { serializePrisma } from "@/lib/serialize";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SupervisorJobDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const job = await prisma.job.findUnique({
    where: { slug },
    include: {
      client: { select: { id: true, slug: true, name: true, contactEmail: true, contactName: true } },
      areas: {
        orderBy: { sortOrder: "asc" },
        include: { items: true, photos: { orderBy: { takenAt: "asc" } } },
      },
      workers: {
        include: { worker: { select: { id: true, name: true, phone: true } } },
      },
      signature: true,
      report: true,
    },
  });

  if (!job) notFound();

  const serialized = serializePrisma(job);

  return <SupervisorJobDetail job={serialized as unknown as Parameters<typeof SupervisorJobDetail>[0]["job"]} />;
}
