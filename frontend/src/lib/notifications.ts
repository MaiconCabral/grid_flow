export type AppNotification = {
  id: number;
  type: "asset_added" | "queued" | "pending_review" | "approved" | "revision_requested";
  activity_id: number;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

export type NotificationFeed = {
  data: AppNotification[];
  unread: number;
};

/** Inserts one notice at the top when it is not already listed. */
export function applyNotification(current: AppNotification[], incoming: AppNotification) {
  if (current.some((item) => item.id === incoming.id)) return current;
  return [incoming, ...current];
}

/** Formats a notice timestamp as a short English age. */
export function notificationAge(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
