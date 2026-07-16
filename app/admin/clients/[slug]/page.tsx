export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ClientDetailClient from "./ClientDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const client = await prisma.client.findUnique({
    where: { slug },
    include: {
      jobs: {
        orderBy: { scheduledDate: "desc" },
        take: 20,
        select: {
          id: true,
          slug: true,
          jobNumber: true,
          title: true,
          status: true,
          scheduledDate: true,
          workers: {
            select: { worker: { select: { id: true, name: true } } },
          },
          signature: { select: { id: true } },
          report: { select: { id: true } },
        },
      },
      recurringSchedules: {
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          recurrence: true,
          daysOfWeek: true,
          dayOfMonth: true,
          scheduledTime: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          jobs: true,
          recurringSchedules: true,
        },
      },
    },
  });

  if (!client) notFound();

  return <ClientDetailClient client={client} />;
}
