/**
 * Hook for push notifications
 * Works with service worker for background push notifications
 */
import { useState, useEffect, useCallback } from "react";

interface NotificationState {
  permission: NotificationPermission | "unsupported";
  enabled: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: "default",
    enabled: false,
  });

  useEffect(() => {
    if (!("Notification" in window)) {
      setState({ permission: "unsupported", enabled: false });
      return;
    }

    setState({
      permission: Notification.permission,
      enabled: Notification.permission === "granted",
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState({
        permission,
        enabled: permission === "granted",
      });
      return permission === "granted";
    } catch (err) {
      console.error("Failed to request notification permission:", err);
      return false;
    }
  }, []);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (state.enabled && "Notification" in window) {
        new Notification(title, {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          ...options,
        });
      }
    },
    [state.enabled]
  );

  // Helper to show job-related notifications
  const notifyJobAssigned = useCallback(
    (jobTitle: string, clientName: string, time: string) => {
      showNotification("Job Baru Ditugaskan", {
        body: `${jobTitle}\n${clientName} @ ${time}`,
        tag: "job-assigned",
        requireInteraction: true,
        data: { url: "/field/jobs" },
      });
    },
    [showNotification]
  );

  const notifyCheckInReminder = useCallback(
    (jobTitle: string, time: string) => {
      showNotification("Reminder: Check-in", {
        body: `${jobTitle} - ${time}`,
        tag: "checkin-reminder",
        data: { url: "/field/jobs" },
      });
    },
    [showNotification]
  );

  return {
    ...state,
    requestPermission,
    showNotification,
    notifyJobAssigned,
    notifyCheckInReminder,
  };
}
