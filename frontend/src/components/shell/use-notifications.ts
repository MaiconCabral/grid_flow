"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { notifyError } from "@/lib/alerts";
import { ApiError, api } from "@/lib/api-client";
import { applyNotification, type AppNotification, type NotificationFeed } from "@/lib/notifications";

/** Polls the notice list once a minute and keeps the bell in sync. */
export function useNotifications() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [alert, setAlert] = useState<AppNotification | null>(null);
  const itemsRef = useRef<AppNotification[]>([]);
  const started = useRef(false);

  /** Replaces the list from the server and announces notices that arrived after the first load. */
  const load = useCallback(async () => {
    try {
      const feed = await api<NotificationFeed>("/notifications");
      const known = new Set(itemsRef.current.map((item) => item.id));
      let next = itemsRef.current;
      const added: AppNotification[] = [];
      for (const item of [...feed.data].reverse()) {
        if (known.has(item.id)) continue;
        next = applyNotification(next, item);
        added.push(item);
      }
      const incoming = new Map(feed.data.map((item) => [item.id, item]));
      next = next.map((item) => incoming.get(item.id) ?? item).filter((item) => incoming.has(item.id));
      itemsRef.current = next;
      setItems(next);
      setUnread(feed.unread);
      if (started.current) {
        const newest = added.filter((item) => item.read_at === null).at(-1) ?? null;
        if (newest) setAlert(newest);
      }
      started.current = true;
    } catch (error) {
      if (!started.current) {
        notifyError(error instanceof ApiError ? error.message : "Could not load notifications.");
      }
      started.current = true;
    }
  }, []);

  useEffect(() => {
    let active = true;
    void load();
    const timer = window.setInterval(() => {
      if (active) void load();
    }, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [load]);

  /** Marks a notice read and opens its task. */
  async function open(item: AppNotification) {
    setAlert((current) => (current?.id === item.id ? null : current));
    if (!item.read_at) {
      try {
        const saved = await api<AppNotification>(`/notifications/${item.id}/read`, { method: "PATCH" });
        const next = itemsRef.current.map((row) => (row.id === saved.id ? saved : row));
        itemsRef.current = next;
        setItems(next);
        setUnread((count) => Math.max(0, count - 1));
      } catch (error) {
        notifyError(error instanceof ApiError ? error.message : "Could not update the notification.");
      }
    }
    router.push(item.href);
  }

  /** Closes the on-screen notice without marking it read. */
  function dismiss() {
    setAlert(null);
  }

  return { items, unread, alert, open, dismiss };
}
