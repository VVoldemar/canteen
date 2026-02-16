import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "~/api/client";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "~/api/notifications";
import type { Notification } from "~/types";

const WS_BASE_URL = "ws://localhost:8000";
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useNotifications(isAuthenticated: boolean) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notificationIdsRef = useRef<Set<number>>(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [items, count] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count);
      notificationIdsRef.current = new Set(items.map((n) => n.id));
    } catch {
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      const updated = await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    const token = getToken();
    if (!token || !isAuthenticated) return;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(
      `${WS_BASE_URL}/ws/notifications?token=${encodeURIComponent(token)}`,
    );

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_notification") {
          const notification: Notification = {
            id: data.id,
            title: data.title,
            body: data.body,
            read: data.read ?? false,
            created_at: data.created_at,
          };
          
          if (notificationIdsRef.current.has(notification.id)) {
            return;
          }
          
          notificationIdsRef.current.add(notification.id);
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      } catch {
      }
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      if (event.code === 4003) return;

      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(
          connectWebSocket,
          RECONNECT_DELAY,
        );
      }
    };

    ws.onerror = () => {};

    wsRef.current = ws;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      notificationIdsRef.current.clear();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    fetchNotifications();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [isAuthenticated, fetchNotifications, connectWebSocket]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
