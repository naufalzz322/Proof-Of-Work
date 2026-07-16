/**
 * Server-Sent Events (SSE) endpoint for real-time notifications
 *
 * Client connects to this endpoint and receives live notifications
 * as they are created by the system.
 */

import { auth } from "@/lib/auth";
import { notificationEmitter } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  // Get latest unread count for this user (notifications NOT seen by this user)
  const unreadCount = await prisma.adminNotification.count({
    where: { NOT: { seenBy: { has: userId } } },
  });

  // Create readable stream for SSE
  const encoder = new TextEncoder();
  let isConnected = true;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMsg = `data: ${JSON.stringify({ type: "connected", unreadCount })}\n\n`;
      controller.enqueue(encoder.encode(connectMsg));

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        if (!isConnected) {
          clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          isConnected = false;
        }
      }, 30000);

      // Listen for new notifications
      const handleNotification = (notification: any) => {
        if (!isConnected) return;
        try {
          const data = JSON.stringify({
            type: "notification",
            notification: {
              id: notification.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              jobSlug: notification.jobSlug,
              jobNumber: notification.jobNumber,
              isRead: notification.isRead,
              createdAt: notification.createdAt,
            },
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Connection closed
        }
      };

      // Handle unread count updates - receives (count, userId) from emit
      const handleUnreadCount = async (count: number, targetUserId?: string) => {
        // If targetUserId is provided, only respond if it matches current user
        // This allows broadcasting to specific users only
        if (targetUserId && targetUserId !== userId) return;
        if (!isConnected) return;
        try {
          // Recalculate count for this user
          const userUnreadCount = await prisma.adminNotification.count({
            where: { NOT: { seenBy: { has: userId } } },
          });
          console.log("[SSE] Broadcasting unreadCount for", userId, ":", userUnreadCount);
          const data = JSON.stringify({ type: "unreadCount", count: userUnreadCount });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Connection closed
        }
      };

      notificationEmitter.on("notification", handleNotification);
      notificationEmitter.on("unreadCount", handleUnreadCount);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        isConnected = false;
        clearInterval(heartbeat);
        notificationEmitter.off("notification", handleNotification);
        notificationEmitter.off("unreadCount", handleUnreadCount);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
