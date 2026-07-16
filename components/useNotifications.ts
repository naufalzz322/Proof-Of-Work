"use client";

import { useEffect, useState, useCallback } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  jobSlug?: string | null;
  jobNumber?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface UseNotificationsOptions {
  onNewNotification?: (notification: Notification) => void;
  onUnreadCountChange?: (count: number) => void;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null);

  const { onNewNotification, onUnreadCountChange } = options;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 1000;

    function connect() {
      // Close existing connection
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource("/api/notifications/stream");

      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttempts = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          setLastEvent({ type: data.type, data: data });

          if (data.type === "notification" && data.notification) {
            onNewNotification?.(data.notification);
          }

          if (data.type === "unreadCount") {
            onUnreadCountChange?.(data.count);
          }
        } catch (e) {
          console.error("Failed to parse SSE data:", e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();

        // Reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, [onNewNotification, onUnreadCountChange]);

  return { isConnected, lastEvent };
}
