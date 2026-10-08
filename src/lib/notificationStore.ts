import { useEffect, useState } from "react";
import { api } from "./api";

/**
 * REH-135: Persistent notification read status hook.
 * Manages notification read status, restoring previously read state from
 * localStorage on reload and synchronizing read updates with /api/notifications.
 */
export function usePersistentNotifications<T extends { id: string; is_read: boolean }>(
  storageKey: string,
  initialItems: T[],
) {
  // 1. Initialize from localStorage immediately so there is no unread flicker on refresh
  const [notifications, setNotifications] = useState<T[]>(() => {
    try {
      const stored = localStorage.getItem(`ethosk_read_notifs_${storageKey}`);
      if (stored) {
        const readIds = new Set<string>(JSON.parse(stored));
        return initialItems.map((n) => (readIds.has(n.id) ? { ...n, is_read: true } : n));
      }
    } catch {
      // ignore JSON parse or localStorage errors
    }
    return initialItems;
  });

  // 2. Fetch server-persisted read IDs on mount and merge
  useEffect(() => {
    api<{ read_ids: string[] }>("/notifications")
      .then((res) => {
        if (res?.read_ids && Array.isArray(res.read_ids) && res.read_ids.length > 0) {
          const serverReadSet = new Set(res.read_ids);
          setNotifications((prev) => {
            const next = prev.map((n) => (serverReadSet.has(n.id) ? { ...n, is_read: true } : n));
            const allReadIds = next.filter((n) => n.is_read).map((n) => n.id);
            try {
              localStorage.setItem(`ethosk_read_notifs_${storageKey}`, JSON.stringify(allReadIds));
            } catch {
              // ignore
            }
            return next;
          });
        }
      })
      .catch(() => {
        // Fallback gracefully if offline or in test environments
      });
  }, [storageKey]);

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      const readIds = next.filter((n) => n.is_read).map((n) => n.id);
      try {
        localStorage.setItem(`ethosk_read_notifs_${storageKey}`, JSON.stringify(readIds));
      } catch {
        // ignore
      }
      return next;
    });

    api(`/notifications/${id}/read`, { method: "PATCH" }).catch(() => {
      // Local state is already persisted
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, is_read: true }));
      const readIds = next.map((n) => n.id);
      try {
        localStorage.setItem(`ethosk_read_notifs_${storageKey}`, JSON.stringify(readIds));
      } catch {
        // ignore
      }
      return next;
    });

    const allIds = notifications.map((n) => n.id);
    api("/notifications/read-all", {
      method: "POST",
      body: { ids: allIds },
    }).catch(() => {
      // Local state is already persisted
    });
  };

  return {
    notifications,
    setNotifications,
    markAsRead,
    markAllAsRead,
  };
}
