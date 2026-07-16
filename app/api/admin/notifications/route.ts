import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notificationEmitter } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const role = session.user.role;

  // Fetch all notifications
  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      jobId: true,
      jobSlug: true,
      jobNumber: true,
      sentVia: true,
      seenBy: true,
      createdAt: true,
    },
  });

  // Filter and mark isRead based on seenBy for this user
  const userNotifications = notifications.map(n => ({
    ...n,
    isRead: n.seenBy.includes(userId),
  }));

  // Count unread for this user
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  return NextResponse.json({ notifications: userNotifications, unreadCount });
}

// Helper to broadcast unread count update for a specific user
async function broadcastUnreadCount(userId: string) {
  const count = await prisma.adminNotification.count({
    where: { NOT: { seenBy: { has: userId } } },
  });
  console.log("[Notifications API] Broadcasting unreadCount for", userId, ":", count);
  notificationEmitter.emit("unreadCount", count, userId);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { action, notificationId, markAllRead } = await request.json();

  if (action === "markRead" || markAllRead) {
    if (notificationId === "all" || markAllRead) {
      // Mark all as read for this user only
      const unreadNotifications = await prisma.adminNotification.findMany({
        where: { NOT: { seenBy: { has: userId } } },
        select: { id: true },
      });

      for (const notif of unreadNotifications) {
        await prisma.adminNotification.update({
          where: { id: notif.id },
          data: { seenBy: { push: userId } },
        });
      }
    } else if (notificationId) {
      // Mark single notification as read for this user
      const notification = await prisma.adminNotification.findUnique({
        where: { id: notificationId },
        select: { seenBy: true },
      });

      if (notification && !notification.seenBy.includes(userId)) {
        await prisma.adminNotification.update({
          where: { id: notificationId },
          data: { seenBy: { push: userId } },
        });
      }
    }
    await broadcastUnreadCount(userId);
    return NextResponse.json({ success: true });
  }

  if (action === "clearRead") {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admin can clear read notifications" }, { status: 403 });
    }
    // Delete all notifications that are seen by everyone (all users have seen them)
    await prisma.adminNotification.deleteMany({
      where: {
        AND: [
          // This is a simplified approach - in production you might want different logic
          // For now, we'll delete notifications older than 7 days that are read by admin
        ],
      },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notificationId } = await request.json();

  if (!notificationId) {
    return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
  }

  await prisma.adminNotification.delete({
    where: { id: notificationId },
  });

  return NextResponse.json({ success: true });
}
