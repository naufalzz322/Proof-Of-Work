/**
 * Hook for managing offline photo queue with localStorage persistence
 */
import { useState, useEffect, useCallback } from "react";

interface QueuedPhoto {
  id: string;
  jobId: string;
  areaId: string;
  type: "BEFORE" | "AFTER";
  file: string; // base64 encoded
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = "offline_photo_queue";

export function useOfflinePhotoQueue() {
  const [queue, setQueue] = useState<QueuedPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setQueue(parsed);
        setPendingCount(parsed.length);
      }
    } catch {
      console.warn("Failed to load offline photo queue");
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      setPendingCount(queue.length);
    } catch {
      console.warn("Failed to save offline photo queue");
    }
  }, [queue]);

  // Add photo to queue
  const addToQueue = useCallback((
    jobId: string,
    areaId: string,
    type: "BEFORE" | "AFTER",
    fileData: string // base64
  ) => {
    const queuedPhoto: QueuedPhoto = {
      id: crypto.randomUUID(),
      jobId,
      areaId,
      type,
      file: fileData,
      timestamp: Date.now(),
      retryCount: 0,
    };
    setQueue((prev) => [...prev, queuedPhoto]);
    return queuedPhoto.id;
  }, []);

  // Remove photo from queue (after successful upload)
  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Process queue when back online
  const processQueue = useCallback(async () => {
    if (queue.length === 0 || isProcessing || !navigator.onLine) return;

    setIsProcessing(true);
    const failedIds: string[] = [];

    for (const photo of queue) {
      try {
        // Convert base64 to blob
        const response = await fetch(photo.file);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append("file", blob, `photo_${photo.id}.jpg`);
        formData.append("areaId", photo.areaId);
        formData.append("type", photo.type);

        const res = await fetch(`/api/jobs/${photo.jobId}/photos`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          removeFromQueue(photo.id);
        } else {
          failedIds.push(photo.id);
        }
      } catch {
        failedIds.push(photo.id);
      }
    }

    // Update queue with failed items (increment retry count)
    if (failedIds.length > 0) {
      setQueue((prev) =>
        prev.map((p) =>
          failedIds.includes(p.id) ? { ...p, retryCount: p.retryCount + 1 } : p
        )
      );
    }

    setIsProcessing(false);
  }, [queue, isProcessing, removeFromQueue]);

  // Auto-process when coming back online
  useEffect(() => {
    const handleOnline = () => {
      processQueue();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [processQueue]);

  // Clear queue (for testing)
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    queue,
    pendingCount,
    isProcessing,
    addToQueue,
    removeFromQueue,
    processQueue,
    clearQueue,
  };
}
